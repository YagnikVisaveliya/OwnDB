import { Router } from 'express'
import { createInstance, deleteInstance, getInstance, listInstances } from '../controller/instances.controller.js';


const router = Router();

//store in memory, should be replaced by database in production


router.route("/").post(createInstance);
router.route("/all").get(listInstances);
router.route("/:id").get(getInstance);
router.route("/:id").delete(deleteInstance);


export default router
