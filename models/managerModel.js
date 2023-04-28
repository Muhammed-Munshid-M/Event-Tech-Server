import mongoose from 'mongoose'

const managerSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    address:{
        type:String,
        // required:true
    },
    adhaar: {
        type:Array,
        // required:true
    },
    license_or_voterId: {
        type:Array,
        // required:true
    },
    company_name: {
        type:String,
        // required:true
    },
    password:{
        type:String,
        required:true
    },
    manager_image:{
        type:Array
    },
    description: {
        type:String
    },
    recent_work: {
        type:Array
    },
    upload_photo: {
        type:Array
    },
    approval:{
        type:Boolean,
        default:false
    },
    block: {
        type:Boolean,
        default:false
    }
})


const managerModel = mongoose.model('managers',managerSchema)
export default managerModel