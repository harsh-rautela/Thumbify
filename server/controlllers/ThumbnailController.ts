import {Request,response,Response} from "express"
import Thumbnail from "../models/Thumbnail.js";
import ai from "../configs/ai.js";
import { GenerateContentConfig } from "@google/genai";
import path from "path";
import fs from 'fs'
import {v2 as cloudinary} from 'cloudinary' 
const stylePrompts ={
    'Bold & Graphic': 'eye-catching thumbnail, bold typography,Vibrant colors, expressive facial reaction, dramatic lighting, high contrast, click-worthy composition, professional style',
'Tech/Futuristic': 'futuristic thumbnail, sleek modern design,digital UI elements, glowing accents, holographic effects,cyber-tech aesthetic, sharp lighting, high-tech atmosphere',
'Minimalist': 'minimalist thumbnail, clean layout, simple shapes, limited color palette, plenty of negative space, modern flat design, clear focal point',
'Photorealistic': 'photorealistic thumbnail, ultra-realistic lighting, natural skin tones, candid moment, DSLR-style photography, lifestyle realism, shallow depth of field',
'Illustrated': 'illustrated thumbnail, custom digital illustration, stylized characters, bold outlines, vibrant colors, creative cartoon or vector art style',
}
const colorSchemeDescription = {
    vibrant: 'vibrant and energetic colors, high saturation, boldcontrasts, eye-catching palette',
sunset: 'warm sunset tones, orange pink and purple hues, softgradients, cinematic glow',
forest: 'natural green tones, earthy colors, calm and organicpalette, fresh atmosphere',
neon: 'neon glow effects, electric blues and pinks, cyberpunk lighting, high contrast glow',
purple: 'purple-dominant color palette, magenta and violet tones, modern and stylish mood',
monochrome: 'black and white color scheme, high contrast, dramatic lighting, timeless aesthetic',
ocean: 'cool blue and teal tones, aquatic color palette, fresh and clean atmosphere',
pastel: 'soft pastel colors, low saturation, gentle tones ,calm and friendly aesthetic'
}
export const generateThumbnail = async (req:Request,res:Response)=>{
    try {
        const {userId}=req.session;
        const {title,prompt:user_prompt,style,aspect_ratio,color_scheme,text_overlay}=req.body;
        const thumbnail = await Thumbnail.create({
            userId,
            title,
            prompt_used:user_prompt,
            style,
            aspect_ratio,
            color_scheme,
            text_overlay,
            isGenerating:true
        });

        const model = "gemini-2.5-flash-image";
        const generationConfig:GenerateContentConfig = {
            maxOutputTokens:1024,
            temperature:1,
            topP:0.8,
            responseModalities:["image"],
            imageConfig: {
                aspectRatio:aspect_ratio|| '16:9',
                imageSize:'1K'
            },
        };
        let prompt = `Create a ${stylePrompts[style as keyof typeof stylePrompts]} for: "${title}" `;
        if(color_scheme){
            prompt+=`use a ${colorSchemeDescription[color_scheme as keyof typeof colorSchemeDescription]} color scheme`
        }
        if(user_prompt){
            prompt+=`Additional details: ${user_prompt}`;
        }
        prompt+= `The Thumbnail should be ${aspect_ratio}, visually stunning and designed to maximize click-through rate. Make it bold, professional, and impossible to ignore.`
        const response:any = await ai.models.generateContent({
            model,
            contents:[prompt],
            config:generationConfig
        })
        if(!response?.candidates?.[0]?.content?.parts){
            throw new Error('Unexpected response');
        }
        const parts = response.candidates[0].content.parts;
        let finalBuffer: Buffer | null = null;
        for(const part of parts){
            if(part.inlineData){
                finalBuffer = Buffer.from(part.inlineData.data,'base64');
            }
        }
        if(!finalBuffer){
            throw new Error('No image data found in response');
        }
        const filename = `file-output-${Date.now()}.png`
        const filePath = path.join('images',filename);
        fs.mkdirSync('images',{recursive: true});
        fs.writeFileSync(filePath,finalBuffer);

        const uploadResult = await cloudinary.uploader.upload(filePath,{
            resource_type:"image"
        });
        thumbnail.image_url = uploadResult.url;
        thumbnail.isGenerating = false;
        await thumbnail.save();
        res.json({message:"Thumbnail Generated",thumbnail});
        fs.unlinkSync(filePath);
    } catch(error:any){
        res.status(500).json({
            message:error.message,
        })


    }

}

export const deleteThumbnail = async (req:Request,res:Response)=>{
    try {
        const {id}=req.params;
        const {userId}=req.session;
        const thumbnail = await Thumbnail.findByIdAndDelete({
            _id:id,
            userId
        });

       res.json({message: 'Thumbnail deleted successfully'})
    } catch(error:any){
        res.status(500).json({
            message:error.message,
        })


    }

}