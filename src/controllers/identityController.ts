import { Request, Response } from 'express';
import { IdentityService } from '../services/identityService';
import { IdentifyRequest } from '../types';

export class IdentityController {
    private identityService: IdentityService;

    constructor() {
        this.identityService = new IdentityService();
    }

    async identify(req: Request, res: Response): Promise<void> {
        try {
            const identifyRequest: IdentifyRequest = req.body;
            const result = await this.identityService.identify(identifyRequest);
            
            res.status(200).json(result);
        } catch (error) {
            console.error('Error in identify endpoint:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}