import { AsyncStorage } from 'react-native'
import device from './src/util/device';
import AppInfo from './src/module/app/AppInfo';
import theme from './src/util/Theme';
import network from './src/module/common/network';


import { NETWORK_ENV_MAINNET } from './src/config/const';
import detectionRisk from './src/module/app/DetectionRisk'
import logger from './src/util/logger';

import i18n from './src/module/i18n/i18n';
import launch from './src/module/launch/launch';
import { Navigation } from 'react-native-navigation';
import RiskWarningScreen from './src/page/RiskWarningScreen';


logger.start()
console.disableYellowBox = true; // 忽略控制台黄色警告

start()

async function start() {
    if (!detectionRisk()) {
        const env = NETWORK_ENV_MAINNET
        network.env = env

        await Promise.all([device.installID(), i18n.setup()])

        const AccountStore = require('./src/module/wallet/account/AccountStore').default
        const DeviceSecurity = require('./src/module/security/DeviceSecurity').default
        Promise.all([AccountStore.setup(env), DeviceSecurity.setup()]).then(async () => {
            require('./src/page/rrwalletRegisterScreens').registerScreens()
            launch({ appStyle })
        })
    } else {
        launcRiskModel()
    }
}

async function launcRiskModel() {
    const AccountStore = require('./src/module/wallet/account/AccountStore').default
    await AccountStore.setup(NETWORK_ENV_MAINNET)
    Navigation.registerComponent(RiskWarningScreen.screenID, () => RiskWarningScreen);
    Navigation.startSingleScreenApp({
        screen: {
            screen: RiskWarningScreen.screenID
        }
    })
}

const appStyle = {
    orientation: 'portrait',
    hideBackButtonTitle: true,
    keepStyleAcrossPush: false,
    backButtonImage: require('@img/nav/nav-back.png')
}