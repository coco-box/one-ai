import { Request, Response } from 'express';
import { success, created, serverError } from '../../utils/response';
import { SettingService } from './setting.service';

const settingService = new SettingService();

export class SettingController {
  public getSettings(req: Request, res: Response) {
    try {
      const data = settingService.getSettings();
      success(res, 'Settings retrieved successfully', data);
    } catch (error: any) {
      serverError(res, error.message);
    }
  }

  public updateSettings(req: Request, res: Response) {
    try {
      const { settings } = req.body;
      const data = settingService.updateSettings(settings);
      created(res, 'Settings updated successfully', data);
    } catch (error: any) {
      serverError(res, error.message);
    }
  }
} 