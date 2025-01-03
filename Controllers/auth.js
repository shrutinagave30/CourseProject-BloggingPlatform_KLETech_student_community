const asyncErrorWrapper = require("express-async-handler");
const User = require("../Models/user");
const CustomError = require("../Helpers/error/CustomError");
const { sendToken } = require("../Helpers/auth/tokenHelpers");
const sendEmail = require("../Helpers/Libraries/sendEmail");
const { validateUserInput, comparePassword } = require("../Helpers/input/inputHelpers");

const ALLOWED_EMAIL_DOMAIN = "@kletech.ac.in";

const getPrivateData = asyncErrorWrapper((req, res, next) => {
    return res.status(200).json({
        success: true,
        message: "You got access to the private data in this route",
        user: req.user,
    });
});

const register = asyncErrorWrapper(async (req, res, next) => {
    const { username, email, password } = req.body;

    // Validate email domain strictly
    if (!email || !email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
        return next(
            new CustomError(`Registration is only allowed by college mail_id`, 400)
        );
    }

    const newUser = await User.create({
        username,
        email,
        password,
    });

    sendToken(newUser, 201, res);
});

const login = asyncErrorWrapper(async (req, res, next) => {
    const { email, password } = req.body;

    if (!validateUserInput(email, password)) {
        return next(new CustomError("Please check your inputs", 400));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return next(new CustomError("Invalid credentials", 404));
    }

    if (!comparePassword(password, user.password)) {
        return next(new CustomError("Please check your credentials", 404));
    }

    sendToken(user, 200, res);
});

const forgotpassword = asyncErrorWrapper(async (req, res, next) => {
    const { URI, EMAIL_USERNAME } = process.env;

    const resetEmail = req.body.email;

    const user = await User.findOne({ email: resetEmail });

    if (!user) {
        return next(new CustomError("There is no user with that email", 400));
    }

    const resetPasswordToken = user.getResetPasswordTokenFromUser();

    await user.save();

    const resetPasswordUrl = `${URI}/resetpassword?resetPasswordToken=${resetPasswordToken}`;

    const emailTemplate = `
    <h3 style="color: red"> Reset Your Password </h3>
    <p>This <a href=${resetPasswordUrl} target='_blank'>Link</a> will expire in 1 hour.</p>
    `;

    try {
        sendEmail({
            from: EMAIL_USERNAME,
            to: resetEmail,
            subject: "✔ Reset Your Password ✔",
            html: emailTemplate,
        });

        return res.status(200).json({
            success: true,
            message: "Email Sent",
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        return next(new CustomError("Email could not be sent", 500));
    }
});

const resetpassword = asyncErrorWrapper(async (req, res, next) => {
    const newPassword = req.body.newPassword || req.body.password;

    const { resetPasswordToken } = req.query;

    if (!resetPasswordToken) {
        return next(new CustomError("Please provide a valid token", 400));
    }

    const user = await User.findOne({
        resetPasswordToken: resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next(new CustomError("Invalid token or session expired", 400));
    }

    user.password = newPassword;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.status(200).json({
        success: true,
        message: "Reset Password access successful",
    });
});

module.exports = {
    register,
    login,
    resetpassword,
    forgotpassword,
    getPrivateData,
};
