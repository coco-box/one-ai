export class SettingService {
  public getSettings() {
    return {
      theme: 'dark',
      language: 'en',
      notifications: {
        email: true,
        sms: false,
      },
    };
  }

  public updateSettings(settings: any) {
    return {
      message: 'Settings updated successfully',
      newSettings: settings,
      timestamp: new Date(),
    };
  }
} 