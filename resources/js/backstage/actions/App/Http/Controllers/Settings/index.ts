import ProfileController from './ProfileController'
import PasswordController from './PasswordController'
import TwoFactorAuthenticationController from './TwoFactorAuthenticationController'
import UsersController from './UsersController'
import FooterController from './FooterController'

const Settings = {
    ProfileController: Object.assign(ProfileController, ProfileController),
    PasswordController: Object.assign(PasswordController, PasswordController),
    TwoFactorAuthenticationController: Object.assign(TwoFactorAuthenticationController, TwoFactorAuthenticationController),
    UsersController: Object.assign(UsersController, UsersController),
    FooterController: Object.assign(FooterController, FooterController),
}

export default Settings