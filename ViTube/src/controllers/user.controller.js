import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'

// Access and Refresh Token Generate karna hain.
const generateAccessandRefreshToken = async(userId) => 
{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        //Adding token to DB using 'user'
        user.refreshToken = refreshToken
        //Saving New Updated object to user.
        await user.save({validatBeforeSave: false});

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}

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
    const existedUser = await User.findOne({
        $or: [{username}, {email}] //checks if username or email exists in DB or not
    })
    if (existedUser) {
        throw new ApiError(409, "User with email already exists")
    }



    //Handling Images
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
console.log("REQ FILES:", req.files);
console.log("REQ BODY:", req.body);
    if (!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    //Upload Files On Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    console.log(avatar)
    // Checking if they are uploaded or not 
    if (!avatar){
        throw new ApiError(400, "Avatar file is not uploaded")
    }
     if (!coverImage){
        throw new ApiError(400, "Cover Image file is not uploaded")
    }

    // Save all data to Database
    const user = await User.create({
        fullname,
        avatar: avatar?.url || avatar?.secure_url,
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
        new ApiResponse(200, createdUser, "User Created Successfully")
    )
})

//Login User Functionality
//Todos
//Take username and password from user.
//validate the format
//search in DB and find email/username of that name.
//also check password.
//If correct head to profile -> generate access token and refreshtoken 
// send token in secure cookies
//If not give message

const loginUser = asyncHandler(async(req,res) => {
    const {email, username, password} = req.body;

    //If username or password is not entered
    if (!(email || username)){
        throw new ApiError(400,"Please enter Email or Username")
    }
    //User is object of mongo(it gives access to method available thorugh mongo)
    //finding username or password in DB
    const user = await User.findOne({
        $or: [{email}, {username}]
    })

    //Giving error if user doesn't exist
    if (!user){
        throw new ApiError(404, "User doesn't exist")
    }
    //Checking if password is correct or not.
    const isPasswordValid = await user.isPasswordCorrect(password)

     if (!isPasswordValid){
        throw new ApiError(404, "Password incorrect")
    }

    const {accessToken, refreshToken} = await generateAccessandRefreshToken(user._id);

    //Sending it to cookies
    //ABhi user ke pass refreshToken empty hain humein add karna padega uss. Konse user ke pass[Line: 128]
    const loginUser = await User.findById(user._id).select("-password -refreshToken");

    //Setting Option to cookies, of who can change it.
    const options = {
        httpOnly: true,
        secure: true
    }//Ab isse sirf server hi modify karega.

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse
        (
            200,
            {
                user: loginUser,
                accessToken,
                refreshToken
            },
            "User Logged In Successfully"
        )
    )


})

//Logout Functionality In User
const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id, //Find kaise karna hain
    {
        $set: {
            refreshToken: undefined
        }
    },
    {
        new: true
    }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User Logged Out")
    )
})


//Login Session has ended. and access token has expired but we want to reassign access token.
const refreshAccessToken = asyncHandler(async(req,res)=> {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, 'unauthorizedrequest')
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        //Matching DB and User Token
        if (incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401, "Refresh Token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newrefreshToken} = await generateAccessandRefreshToken(user._id)
        return res.status(200)
        .cookie("accessToken",accesstoken, options)
        .cookie("refreshToken",newrefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken},
                "access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=> {
    const {oldPassword, newPassword} = req.body;

    const user = await User.findOne(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect){
        throw new ApiError(401, "Enter Correct Old Password")
    }

    user.password = newPassword;
    user.save({validatBeforeSave: false})

    return res.status(200).json(new ApiResponse(200, {}, "Password Changed Successfully"))

})

const getCurrentUser = asyncHandler(async(req,res)=> {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User fetched"))
})

const updateAccountDetails = asyncHandler(async(req, res)=>{
    const {fullname, email} = req.body
    if (!fullname || !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set:{
            fullname,
            email
        }}
    ).select("-password")

    return res.status(200).json(new ApiResponse(200, user, "Account details updated"))
})

//Updating files
const updateUserAvatar = asyncHandler(async(req,res)=> {
   const avatarLocalPath = req.files?.path
   if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
   }
//Delete old Image 
   const avatar = await uploadOnCloudinary(avatarLocalPath)
   if (!avatar.url){
        throw new ApiError(400, "Error while uploading an error")
   }

   await User.findByIdAndUpdate(req.user?._id,
    {
        $set: {
            avatar: avatar.url
        }
    },
    {
        new: true
    }
   ).select("-password")
      return res.status(200).json(new ApiResponse(200, user, "Avatar Image Updated"))
})

//Updatiung coverImage
const updateUserCoverImage = asyncHandler(async(req,res)=> {
   const coverImageLocalPath = req.files?.path
   if(!coverImageLocalPath){
        throw new ApiError(400, "coverImageLocalPath is missing")
   }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath)
   if (!coverImage.url){
        throw new ApiError(400, "Error while uploading an error")
   }

   await User.findByIdAndUpdate(req.user?._id,
    {
        $set: {
            coverImage: coverImage.url
        }
    },
    {
        new: true
    }
   ).select("-password")

   return res.status(200).json(new ApiResponse(200, user, "Cover Image Updated"))
})

const getUserChannelProfile = asyncHandler(async(req,res)=> {
    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }

    //Aggregation pipeline
   const channel =  await User.aggregate([
    {
        $match: username?.toLowerCase() //user milega
    },
    {
        $lookup: {
            from: "subscriptions", //Subscriptions mat likhna, kyunki yeh lowercase and plural hoga mongoDB mein.
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        },
        $lookup: {
            from: "subscriptions", //Subscriptions mat likhna, kyunki yeh lowercase and plural hoga mongoDB mein.
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
        },
        
        $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: { //condition
                        if: {$in: [req.user?._id, "$subscriber.subscriber"]}, //$in - checks user in object and array.
                        then: true,
                        else: false 
                    }
                }
            } 
    },
    {
        $project:{
            fullName: 1,
            username: 1,
            subscriberCount: 1,
            channelSubscribedToCount:1,
            email: 1,
            isSubscribed: 1,
            avatar:1,
            coverImage:1
        }  

    }
   ])
   if(!channel?.length){
    throw new ApiError(404, "Channel doesn't error")
   }

   return res.status(200)
   .json(

    new ApiResponse(200, channel[0], "User Channel fetched successfully")
   )
})

//watch History
const watchHistory = asyncHandler(async(req,res)=> {
    // res.user.id - it will give string not mongo object.
    
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id) //converting to mongo id
            },
            
                $lookup: {
                    from: 'videos',
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                       {
                         $lookup: {
                            from: "users",
                            localField: 'owner',
                            foreignField: '_id',
                            as: "owner",
                            pipeline: [{
                                $project: {
                                    fullName: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }]
                        }
                       }
                    ]
                },
                
                    $addFields: {
                        owner: {
                            $first: "owner"
                        }
                    }
                
            
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,
            user[0].watchHistory,
            "Watch History fetched successfully"
        )
    )
})
export 
{
    registerUser,
    loginUser,
    logoutUser, 
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    watchHistory
}