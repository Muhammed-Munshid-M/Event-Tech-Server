import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import managerModel from '../models/managerModel.js';
import formModel from '../models/formModel.js';
import serviceModel from '../models/serviceModel.js';

let Name;
let Email;
let Mobile;
let Company;
let Address;
let Password;

let forgetMobile;

export const signUp = async (req, res) => {
    try {
        let managerData = req.body
        const { name, email, mobile, company, address, password } = req.body
        Name = name
        Email = email
        Mobile = mobile
        Company = company
        Address = address
        Password = password

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

export const resendOtp = async (req, res) => {
    try {
        res.status(200).send({ success: true, data: Mobile, message: 'Otp sended successfully' })
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false })
    }
}

export const signUpWithOtp = async (req, res) => {
    try {
        const managerData = req.body
        console.log(managerData);
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(Password, salt)
        Password = hashedPassword
        const newManager = new managerModel({
            name: Name,
            email: Email,
            mobile: Mobile,
            company_name: Company,
            address: Address,
            password: Password,
            adhaar: managerData.imageUpload1,
            license_or_voterId: managerData.imageUpload2
        })
        await newManager.save()
        res.status(200).send({ success: true, message: 'Your request is sending to admin, After approval of admin, you can login. otherwise you cannot login' })
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
        console.log('manager:' + manager);
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
        const forms = await formModel.findOne({ form: formId })
        console.log(forms);
        res.status(200).send({ data: forms })
    } catch (error) {
        console.log('login', error);
        res.status(500).send({ message: "Error in Login", success: false, error })
    }
}

export const viewServices = async (req, res) => {
    try {
        const managerId = req.body.managerId
        console.log(managerId);
        const serviceList = await serviceModel.findOne({ manager_id: managerId, status:true })
        console.log(serviceList);
        res.status(200).send({ success: true, data: serviceList })
    } catch (error) {
        console.log('login', error);
        res.status(500).send({ message: "Error in Login", success: false, error })
    }
}

export const services = async (req, res) => {
    try {
        const managerId = req.body.managerId
        const { foodChecked, stageChecked, decorateChecked, audioChecked, videoChecked } = req.body
        const existService = await serviceModel.findOne({ manager_id: managerId })
        if (!existService) {
            const newService = new serviceModel({
                manager_id: managerId,
                catering_name: 'Food Service',
                stage_name: 'Stage Service',
                decoration_name: 'Decoration',
                audio_name: 'Audio Service',
                video_name: 'Video Service',
                cateringMenu: [{
                    category_name: ['Starters', 'Main', 'Desserts', 'Salads'],
                    status: foodChecked
                }],
                stageMenu: [{
                    category_name: ['Stage Photo', 'Stage Budget', 'Stage Size'],
                    status: stageChecked
                }],
                decorationMenu: [{
                    category_name: ['Decoration Photo', 'Including Photos', 'Decoration Budget'],
                    status: decorateChecked
                }],
                audioMenu: [{
                    category_name: ['Audio Things Photos', 'Audio Things', 'Price'],
                    status: audioChecked
                }],
                videoMenu: [{
                    category_name: ['Video Things Photos', 'Video Things', 'Price'],
                    status: videoChecked
                }]
            })
            await newService.save()
            res.status(200).send({ success: true })
        } else {
            res.status(200).send({ exist: true, message: 'You have already added' })
        }
    } catch (error) {
        console.log('login', error);
        res.status(500).send({ message: "Error in Login", success: false, error })
    }
}

export const addCatering = async (req, res) => {
    try {
        const managerId = req.body.managerId
        const { starterName, starterPrice, mainName, mainPrice, dessertsName, dessertsPrice, saladsName, saladsPrice } = req.body
        let exist = false
        const existCatering = await serviceModel.findOne({ manager_id: managerId })
        const array = existCatering.cateringMenu
        array.forEach(element => {
            if (element.catering_id == managerId) {
                exist = true
            } else {
                exist = false
            }
        })
        if (!exist) {
            await serviceModel.findOneAndUpdate({ manager_id: managerId }, {
                $set: {
                    cateringMenu: [{
                        catering_id: managerId,
                        category_name: ['Starters', 'Main', 'Desserts', 'Salads'],
                        starter_name: starterName,
                        starter_price: starterPrice,
                        main_name: mainName,
                        main_price: mainPrice,
                        dessert_name: dessertsName,
                        dessert_price: dessertsPrice,
                        salad_name: saladsName,
                        salad_price: saladsPrice
                    }]
                }
            })
            res.status(200).send({ success: true })
        } else {
            await serviceModel.findOneAndUpdate({ manager_id: managerId }, {
                $push: {
                    cateringMenu: [{
                        catering_id: managerId,
                        starter_name: starterName,
                        starter_price: starterPrice,
                        main_name: mainName,
                        main_price: mainPrice,
                        dessert_name: dessertsName,
                        dessert_price: dessertsPrice,
                        salad_name: saladsName,
                        salad_price: saladsPrice
                    }]
                }
            })
            res.status(200).send({ success: true })
        }
    } catch (error) {
        console.log('login', error);
        res.status(500).send({ message: "Error in Login", success: false, error })
    }
}

export const managerProfile = async (req, res) => {
    // try {
    const managerId = req.body.managerId
    const { name, description, imageUpload1, imageUpload2 } = req.body
    const form = await managerModel.findOneAndUpdate({ _id: managerId }, {
        $set: {
            name: name,
            description: description,
            upload_photo: imageUpload1,
            recent_work: imageUpload2,
        }
    })
    console.log(form);
    res.status(200).json(form)
    // } catch (error) {
    //     console.log('login', error);
    //     res.status(500).send({ message: "Error in Login", success: false, error })
    // }
}

export const getDetails = async (req, res) => {
    // try {
    const managerId = req.body.managerId
    const details = await managerModel.findOne({ _id: managerId })
    console.log(details);
    res.status(200).json(details)
    // } catch (error) {
    //     console.log('login', error);
    //     res.status(500).send({ message: "Error in Login", success: false, error })
    // }
}