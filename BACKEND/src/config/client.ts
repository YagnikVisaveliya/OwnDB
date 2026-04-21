import * as k8s from '@kubernetes/client-node';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const kc = new k8s.KubeConfig();

function mapWslPathToWindows(rawPath: string): string {
	if (process.platform !== 'win32') {
		return rawPath;
	}

	// Map Linux home paths from WSL to Windows UNC shares.
	if (rawPath.startsWith('/home/')) {
		const normalized = rawPath.replace(/\//g, '\\');
		const ubuntuCandidate = `\\\\wsl$\\Ubuntu${normalized}`;
		if (fs.existsSync(ubuntuCandidate)) {
			return ubuntuCandidate;
		}
	}

	// Map Linux /mnt/<drive>/ paths to Windows drive-letter paths.
	if (rawPath.startsWith('/mnt/') && rawPath.length > 6) {
		const drive = rawPath[5];
		if (!drive) {
			return rawPath;
		}
		const rest = rawPath.slice(6).replace(/\//g, '\\');
		const candidate = `${drive.toUpperCase()}:\\${rest}`;
		if (fs.existsSync(candidate)) {
			return candidate;
		}
	}

	return rawPath;
}

function normalizeKubeFileRefs(): void {
	for (const cluster of kc.getClusters()) {
		if (cluster.caFile) {
			cluster.caFile = mapWslPathToWindows(cluster.caFile);
		}
	}

	for (const user of kc.getUsers()) {
		if (user.certFile) {
			user.certFile = mapWslPathToWindows(user.certFile);
		}
		if (user.keyFile) {
			user.keyFile = mapWslPathToWindows(user.keyFile);
		}
	}
}

function loadKubeConfig(): void {
	if (process.platform === 'win32') {
		const windowsKubeConfig = path.join(os.homedir(), '.kube', 'config');
		let wslFallback: string | undefined;

		const wslHomeRoot = '\\\\wsl$\\Ubuntu\\home';
		if (fs.existsSync(wslHomeRoot)) {
			for (const userDir of fs.readdirSync(wslHomeRoot)) {
				const candidate = path.join(wslHomeRoot, userDir, '.kube', 'config');
				if (fs.existsSync(candidate)) {
					wslFallback = candidate;
					break;
				}
			}
		}

		if (fs.existsSync(windowsKubeConfig)) {
			kc.loadFromFile(windowsKubeConfig);
		} else if (wslFallback && fs.existsSync(wslFallback)) {
			kc.loadFromFile(wslFallback);
		} else {
			kc.loadFromDefault();
		}
	} else {
		kc.loadFromDefault();
	}

	normalizeKubeFileRefs();
}

loadKubeConfig();

export const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);

export const appsV1Api = kc.makeApiClient(k8s.AppsV1Api);

export const autoscalingV2Api = kc.makeApiClient(k8s.AutoscalingV2Api);


