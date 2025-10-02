import {Router} from "express"
import { loginUser,registerUser,logoutUser,refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, watchHistory } from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.js"
import {JWToken} from "../middlewares/auth.middleware.js"
import multer from "multer"
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
router.route('/change-password').post(verifyJWT, changeCurrentPassword)
router.route('/current-user').get(verifyJWT, getCurrentUser)
router.route('/update-account').patch(verifyJWT, updateAccountDetails)
router.route('/avatar').patch(verifyJWT,upload.single("avatar"), updateUserAvatar)
router.route('/cover-image').patch(verifyJWT,upload.single("coverImage"), updateUserCoverImage)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT,watchHistory)
export default router