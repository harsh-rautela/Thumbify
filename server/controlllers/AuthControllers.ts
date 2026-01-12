import {Request,Response} from 'express'
import User from '../models/User.js'
import bcrypt from 'bcrypt'
export const registerUser = async (req:Request,res:Response)=>{
    try {
        const {name,email,password}= req.body;
        const user = await User.findOne({email});
        if(user){
            return res.status(400).json({
                message: 'user already exists'
            })
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);
        const newuser = new User({name,email,password:hashedPassword});
        await newuser.save();
        // setting user data in session
        req.session.isLoggedIn = true;
        req.session.userId=newuser._id;
        return res.json({
            message:"Account created successfullt",
            user: {
                _id:newuser._id,
                name: newuser.name,
                email: newuser.email,
            }
        })
    } catch(error:any){
        res.status(500).json({
            message:error.message
        })
    }
}
export const loginUser = async (req:Request,res:Response)=>{
try {

     const {email,password}= req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({
                message: 'invalid email '
            })
        }
        const isPasswordCorrect = await bcrypt.compare(password,user.password)
        if(!isPasswordCorrect){
            res.status(400).json({
                message: 'invalid password '
            })
        }
        
       
        req.session.isLoggedIn = true;
        req.session.userId=user._id;
        return res.status(200).json({
            message:"Login successfully",
            user: {
                _id:user._id,
                name: user.name,
                email: user.email,
            }
        })

} catch(error:any){
    res.status(500).json({
            message:error.message
        })
}
}
export const logoutUser = async (req:Request,res:Response)=>{
    req.session.destroy((error:any)=>{
        if(error){
            console.log(error);
            return res.status(500).json({
                message: error.message
            })
        }
    })
    return res.json({message:"Logout successfully"})
}
export const verifyUser = async (req:Request,res:Response)=>{
   try {
    const {userId} =req.session;
    const user = await User.findById(userId).select('-password');
    if(!user){
         return res.status(400).json({
                message: 'Invalid user'
            })
    } 
    return res.json({user});
} catch(error:any){
    return res.status(500).json({
                message: error.message
            })
   }
}

