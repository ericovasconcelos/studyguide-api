"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GranTokenController = void 0;
const logger_1 = require("../utils/logger");
class GranTokenController {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    /**
     * Salva o token do Gran associado a um usuário
     */
    async saveToken(req, res) {
        try {
            const { userId } = req.params;
            const { granToken } = req.body;
            if (!userId) {
                res.status(400).json({ success: false, error: 'User ID is required' });
                return;
            }
            if (!granToken) {
                res.status(400).json({ success: false, error: 'Gran token is required' });
                return;
            }
            const result = await this.userRepository.updateGranToken(userId, granToken);
            if (result.failed()) {
                res.status(400).json({ success: false, error: result.getError() });
                return;
            }
            // Também armazenamos no localStorage para compatibilidade com código existente
            // Este comportamento pode ser removido quando todo o código for migrado
            res.status(200).json({
                success: true,
                message: 'Gran token saved successfully',
                data: {
                    userId,
                    tokenUpdatedAt: new Date()
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error saving Gran token', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    /**
     * Obtém o token do Gran associado a um usuário
     */
    async getToken(req, res) {
        try {
            const { userId } = req.params;
            if (!userId) {
                res.status(400).json({ success: false, error: 'User ID is required' });
                return;
            }
            const user = await this.userRepository.findById(userId);
            if (!user) {
                res.status(404).json({ success: false, error: 'User not found' });
                return;
            }
            const granToken = user.getGranToken();
            const granTokenUpdatedAt = user.getGranTokenUpdatedAt();
            res.status(200).json({
                success: true,
                data: {
                    granToken,
                    granTokenUpdatedAt
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting Gran token', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    /**
     * Remove o token do Gran associado a um usuário
     */
    async clearToken(req, res) {
        try {
            const { userId } = req.params;
            if (!userId) {
                res.status(400).json({ success: false, error: 'User ID is required' });
                return;
            }
            const result = await this.userRepository.clearGranToken(userId);
            if (result.failed()) {
                res.status(400).json({ success: false, error: result.getError() });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Gran token cleared successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Error clearing Gran token', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}
exports.GranTokenController = GranTokenController;
//# sourceMappingURL=GranTokenController.js.map