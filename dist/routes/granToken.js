"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const GranTokenController_1 = require("../controllers/GranTokenController");
const MongoUserRepository_1 = require("../infrastructure/repositories/MongoUserRepository");
const router = express_1.default.Router();
const userRepository = new MongoUserRepository_1.MongoUserRepository();
const granTokenController = new GranTokenController_1.GranTokenController(userRepository);
// Obter token do Gran
router.get('/:userId', async (req, res) => {
    await granTokenController.getToken(req, res);
});
// Salvar token do Gran
router.post('/:userId', async (req, res) => {
    await granTokenController.saveToken(req, res);
});
// Remover token do Gran
router.delete('/:userId', async (req, res) => {
    await granTokenController.clearToken(req, res);
});
exports.default = router;
//# sourceMappingURL=granToken.js.map