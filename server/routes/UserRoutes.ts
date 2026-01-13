import express from 'express'
import { getThumbnailById, getUsersThumbnails } from '../controlllers/UserController.js';
import protect from '../middlewares/Auth.js';
const userRouter = express.Router();
userRouter.get('/thumbnails',protect,getUsersThumbnails);
userRouter.get('/thumbnail/:id',protect,getThumbnailById)
export default userRouter