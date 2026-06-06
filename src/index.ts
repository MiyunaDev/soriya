import { UserService } from './services/UserService';

export interface FrameworkConfig {
  services: {
    userService: string;
    notificationService: string;
  };
}

export class Soriya {
  public user: UserService;

  constructor(config: FrameworkConfig) {
    if (!config.services.userService || !config.services.notificationService) {
      throw new Error('Service URLs must be defined in configuration.');
    }

    this.user = new UserService(config.services.userService);
  }
}
