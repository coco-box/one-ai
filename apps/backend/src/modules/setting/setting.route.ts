import { Router } from 'express';
import { SettingController } from './setting.controller';

const router = Router();
const settingController = new SettingController();

router.get('/', settingController.getSettings);
router.post('/', settingController.updateSettings);

export default router; 