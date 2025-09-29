import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResonse } from "../utils/ApiResponse.js"
const registerUser = asyncHandler(async (req,res)=> {
    /*
    Step 1: Take data from user such as email,username,password.
    Step 2: check data from user.
    Step 3: check if user already exists
    Step 4: Check if images, check for avatar
    Step 5: Upload them to cloudinary, avatar
    Step 6: create user object in DB
    Step 7: remove password & refresh token field from response 
    Step 8: Check for user creation
    Step 9: return res 
    */

    const {fullname, email, username, password} =req.body
    console.log(email);

    //Validation
    //Beginner Way
    // if (fullname === ""){
    //     throw new ApiError(400, "fullname is required")
    //}

    //Method 2

    if ([fullname,email,username,password].some((field)=> field?.trim()==="")){
        throw new ApiError(400, "All fields are required")
    }

    //Checking if user already exists or not.
    const existedUser = User.findOne({
        $or: [{username}, {email}] //checks if username or email exists in DB or not
    })
    if (existedUser) {
        throw new ApiError(409, "User with email already exists")
    }


    //Handling Images
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    //Upload Files On Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // Checking if they are uploaded or not 
    if (!avatar){
        throw new ApiError(400, "Avatar file is required")
    }
     if (!coverImage){
        throw new ApiError(400, "Avatar file is required")
    }

    // Save all data to Database
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })


    //Check whether user is created or not. and remove password and refresh token
    //select mein woh likte jo excludes karna hain jaise password and refreshToken
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering user.")
    }

    //Sending ApiResponse
    return res.status(201).json(
        new ApiResonse(200, createdUser, "User Created Successfully")
    )
})

export {registerUser}