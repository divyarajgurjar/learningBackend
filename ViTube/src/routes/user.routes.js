import {Router} from "express"
import { loginUser,registerUser,logoutUser,refreshAccessToken } from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.js"
import {JWToken} from "../middlewares/auth.middleware.js"
const router = Router()

router.route("/register").post(//adding middlewares
    upload.fields([
        {
            name: "avatar",
            maxCount:1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ])
    ,
    registerUser);

router.route("/login").post(loginUser);

//Securing routes
router.route("/logout").post(JWToken, logoutUser);
//Pehle JWToken run hoga phir issmein humein next() kiya woh bolega. ki mera hogaya logoutUser run karo.

router.route("/refresh-token").post(refreshAccessToken)//Hum JWToken nhi use karenge. 
export default router