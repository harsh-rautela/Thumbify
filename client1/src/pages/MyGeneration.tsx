import { useEffect, useState } from "react"
import SoftBackdrop from "../components/SoftBackdrop"
import {  type IThumbnail } from "../assets/assets"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRightIcon, DownloadIcon, TrashIcon } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import api from "../configs/api"
import toast from "react-hot-toast"

const MyGeneration = () => {
  const [thumbnails, setThumbnails]=useState<IThumbnail[]>([])
  const {isLoggedIn} = useAuth()
  const [loading, setLoading]=useState(false);
  const navigate = useNavigate()
  const aspectRatioClassMap:Record<string,string>={
    '16:9':'aspect-video',
    '1:1':'aspect-square',
    '9:16':'aspect-[9/16]'
  }
  const fetchThumbnails= async ()=>{
    try {
      setLoading(true);
      const {data} = await api.get('/api/user/thumbnails');
      setThumbnails(data?.thumbnails || []);
    } catch(error:any){
      console.log(error);
      toast.error(error?.response?.data?.message || error.message)
    }
    finally{
      setLoading(false);
    }
  }
  const handleDownload = (image_url: string)=>{
    const link = document.createElement('a');
    link.href =image_url.replace('/upload','/upload/f1_attachment');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  const handleDelete = async (id:string)=>{
   try {
    const confirm = window.confirm('Are you sure you want to delete this thhumbnail?');
    if(!confirm){
      return;
    }
    const {data} = await api.delete(`api/thumbnail/delete/${id}`);
toast.success(data.message);
setThumbnails(thumbnails.filter((t)=>t._id!==id))
   } catch(error:any){
    toast.error(error?.response?.data?.message ||error.message )

   }
  }
  useEffect(()=>{
    if(isLoggedIn){
          fetchThumbnails();
    }

  },[isLoggedIn])
  return (
    <>
    <SoftBackdrop/>
    <div className="mt-32 min-h-screen px-6 md:px-16 lg:px-24 xl:px-32">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-200">My Generations</h1>
        <p className="text-sm text-zinc-400 mt-1">View and manage all your AI- generated thumbnails</p>
      </div>
      {
        loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ">
          {
            Array.from({length:6}).map((_,i)=>(
              <div key={i} className="rounded-2xl bg-white/6 border border-white/10 animate-pulse h-[260px]">
              </div>
            ))
          }

        </div>)
      }
      { !loading && thumbnails.length === 0 && (
        <div className="text-center py-24">
          <h3 className="text-lg font-semibold text-zinc-200 ">No Thumbnails yet</h3>
          <p className="text-sm text-zinc-400 mt-2">Generate your frst Thumbnail to see it here</p>

        </div>
      ) 

      }
      {
        !loading && thumbnails.length >0 && (
          <div className="columns-1 sm:columns-2 lg:columns-3 2xl:columns-4 gap-8 ">
            {thumbnails.map((th: IThumbnail)=>{
              const aspectClass = aspectRatioClassMap[th.aspect_ratio || '16:9'];
              return (
                <div key={th._id} onClick={()=>navigate(`/generate/${th._id}`)} className="mb-8 group relative cursor-pointer rounded-2xl bh-white/6 border border-white/10 transition shadow-xl break-inside-auto">
                  <div className={`relative overflow-hidden rounded-t-2xl ${aspectClass} bg-black`}>{th.image_url? (<img src={th.image_url} alt={th.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 "/>):
                  (<div className="w-full h-full flex items-center justify-center text-sm text-zinc-400">
                    {th.isGenerating? 'Generating':'No image'}
                  </div>)}
                    {
                      th.isGenerating && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-sm font-medium"> Genrating...</div>
                    }
                  </div>
                  
                    <div className="p-4 space-y-2">
                      <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2">
                          {th.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
                        <span className="px-2 py-0.5 rounded bg-white/8">
                        {th.style}</span>
                        <span className="px-2 py-0.5 rounded bg-white/8">
                        {th.color_scheme}</span>
                        <span className="px-2 py-0.5 rounded bg-white/8">
                        {th.aspect_ratio}</span>
                      </div>
                      <p className="text-sm text-zinc-500">{new Date(th.createdAt!).toDateString()}</p>

                    </div>
                    <div onClick={(e)=>e.stopPropagation()} className="absolute bottom-2 right-2 max-sm:flex sm:hidden group-hover:flex gap-1.5">
                      <TrashIcon className="size-6 bg-black/50 p-1 rounded hover:bg-pink-600 transition-all" onClick={()=>handleDelete(th._id)}/>
                      <DownloadIcon className="size-6 bg-black/50 p-1 rounded hover:bg-pink-600 transition-all" onClick={()=>handleDownload(th.image_url!)}/>
                      <Link target="_blank" to={`/preview?thumbnail_url=${th.image_url}&title=${th.title}`}>
                          <ArrowRightIcon className="size-6 bg-black/50 p-1 rounded hover:bg-pink-600 transition-all" />
                      </Link>
                      
                    </div>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
    </>
  )
}

export default MyGeneration