// import twilio from 'twilio'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import managerModel from '../models/managerModel.js';
import cloudinary from '../middleware/cloudinary.js';
import userModel from '../models/userModel.js';
import formModel from '../models/formModel.js';

let Name;
let Email;
let Mobile;
let Company;
let Address;
let Password;
let Aadhar;
let License_or_voterId;

let forgetMobile;

export const signUp = async (req, res) => {
    try {
        let managerData = req.body
        const { name, email, mobile, company, address, password,aadhar, license_or_voterId } = req.body
        Name = name
        Email = email
        Mobile = mobile
        Company = company
        Address = address
        Password = password
        Aadhar = aadhar
        License_or_voterId = license_or_voterId

        managerModel.findOne({ email: managerData.email }).then((user) => {
            if (user) {
                res.status(200).send({ exist: true, message: 'You are already signed' })
            } else {
                res.status(200).send({ success: true, message: 'Otp sended successfully' })
            }
        })
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: true })
    }
}

export const resendOtp = async (req,res)=>{
    try {
        res.status(200).send({success:true, data:Mobile, message: 'Otp sended successfully'})
    } catch (error) {
        console.log(error);
        res.status(500).send({success:false})
    }
}

export const signUpWithOtp = async (req, res) => {
    try {
        const image = req.body.imageData
        // cloudinary.uploader.upload(image).then(async(result,err)=>{
        //     console.log(result.secure_url);
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(Password, salt)
            Password = hashedPassword
            // Aadhar = result.secure_url
            const newManager = new managerModel({
                name: Name,
                email: Email,
                mobile: Mobile,
                company_name: Company,
                address: Address,
                password: Password,
                // adhaar: Aadhar,
                // license_or_voterId: License_or_voterId
            })
            await newManager.save()
        // })
        res.status(200).send({ success: true, message: 'Your request is sending to admin, After approval of admin, you can login. otherwise you cannot login'})
    } catch (err) {
        console.log(err);
        res.status(500).send({ success: false })
    }
}

export const forgetPassword = async (req, res) => {
    try {
        forgetMobile = req.body.mobile
        managerModel.findOne({ mobile: forgetMobile }).then((manager) => {
            if (manager) {
                res.status(200).send({ success: true, message: 'Otp sended successfully' });
            } else {
                res.status(200).send({ noacc: true, message: 'You are not registered in this account' })
            }
        })
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: true })
    }
}

export const resetPassword = async (req, res) => {
    try {
        let Password = req.body.password
        let confirmPassword = req.body.confirmPassword
        if (Password === confirmPassword) {
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(Password, salt)
            Password = hashedPassword
            managerModel.findOneAndUpdate({ mobile: forgetMobile }, {
                $set: {
                    password: Password
                }
            }).then(() => {
                res.status(200).send({ success: true, message: 'Your reset password successfully' })
            })
        } else {
            res.status(200).send({ message: 'Your password is not matched' })
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: true })
    }
}

export const Login = async (req, res) => {
    try {
        const { email, password } = req.body
        const manager = await managerModel.findOne({ email: email })
        console.log('manager:'+manager);
        if (manager) {
            const isMatchPswrd = await bcrypt.compare(password, manager.password)
            if (manager.approval) {            
                if (manager.block) {
                    res.status(200).send({ message: 'Admin blocked your account', block: true })
                } else {
                    if (!isMatchPswrd) {
                        res.status(200).send({ message: "Incorrect Password", noUser: false })
                    } else {
                        const token = jwt.sign({ id: manager._id }, process.env.JWT_SECRET, {
                            expiresIn: '1d'
                        }) //the jwt.sign() will generate the token,the expiresIn is for destory the session
                        res.status(200).send({ message: "Login Successfull", success: true, data: token })
                    }
                }
            } else {
                res.status(200).send({ message: 'Your approval is pending...', pendApproval: true })
            }
        } else {
            res.status(200).send({ message: "Incorrect Email or Password", noUser: true })
        }
    } catch (error) {
        console.log('login', error);
        res.status(500).send({ message: "Error in Login", success: false, error })
    }
}



export const managerData = async (req, res) => {
    try {
        const manager = await managerModel.findOne({ _id: req.body.managerId })
        console.log(manager);
        manager.password = undefined
        if (!manager) {
            return res
                .status(200)
                .send({ message: "Manager does not exist", noManager: true })
        } else {
            res.status(200).send({
                success: true, message: "Manager Data created",
                data: manager
            })
        }
    } catch (error) {
        res
            .status(500)
            .send({ message: "Error getting user info", error: true, error })
    }
}

export const bookings = async (req, res) => {
    try {
        const form = await formModel.find()
        res.status(200).json(form)
    } catch (error) {
        console.log('login', error);
        res.status(500).send({ message: "Error in Login", success: false, error })
    }
}

export const bookingDetails = async (req, res) => {
    try {
        const formId = req.params.id
        console.log(formId);
        const forms = await formModel.findOne({form:formId})
        console.log(forms);
        res.status(200).send({data:forms})
    } catch (error) {
        console.log('login', error);
        res.status(500).send({ message: "Error in Login", success: false, error })
    }
}

export const addServices = async (req, res) => {
    // try {
        // const {name,leader,mobile,number} = req.body
        // const newForm = new approvalModel
        const managerId = req.body.managerId
        console.log(managerId);
        const services = req.body
        const { name, leader, mobile, number } = services
        console.log(services)
        const formExist = await managerModel.findOne({_id:managerId})
        if (formExist) {
            await approvalModel.findOneAndUpdate({ _id: managerId }, {
                $push: {
                    services: [{
                        service_name: name,
                        leader: leader,
                        leader_mobile: mobile,
                        employee_numbers: number
                    }]
                }
            }).then((response)=>{
                console.log(response);
                res.status(200).send({ success: true, message: 'success' })
            })
        } else {
            const newForm = new managerModel({
                _id: managerId,
                services: [{
                    service_name: name,
                    leader: leader,
                    leader_mobile: mobile,
                    employee_numbers: number
                }]
            })
            newForm.save()
            res.status(200).send({ success: true, message: 'success' })
        }
    // } catch (error) {
    //     console.log('login', error);
    //     res.status(500).send({ message: "Error in Login", success: false, error })
    // }
}


export const services = async (req, res) => {
    try {
        // const {name,leader,mobile,number} = req.body
        // const newForm = new approvalModel
        const managerId = req.body.managerId
        const form = await managerModel.findOne({_id:managerId})
        console.log(form);
        res.status(200).json(form)
    } catch (error) {
        console.log('login', error);
        res.status(500).send({ message: "Error in Login", success: false, error })
    }
}
