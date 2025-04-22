"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerSyncAdapter = void 0;
const result_1 = require("../../domain/result");
const Study_1 = require("../../domain/entities/Study");
const logger_1 = require("../../utils/logger");
const axios_1 = __importDefault(require("axios"));
class ServerSyncAdapter {
    constructor(userId) {
        this.API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
        this.userId = userId;
    }
    async getStudies() {
        try {
            const response = await fetch(`${this.API_URL}/studies?userId=${this.userId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch studies');
            }
            const data = await response.json();
            const studies = data.map((study) => Study_1.Study.fromEntity(study));
            return result_1.Result.ok(studies);
        }
        catch (error) {
            logger_1.logger.error('Failed to get studies from server', { error });
            return result_1.Result.fail('Failed to get studies from server');
        }
    }
    async saveStudy(study) {
        try {
            const response = await fetch(`${this.API_URL}/studies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(study.toEntity()),
            });
            if (!response.ok) {
                throw new Error('Failed to save study');
            }
            return result_1.Result.ok(undefined);
        }
        catch (error) {
            logger_1.logger.error('Failed to save study to server', { error });
            return result_1.Result.fail('Failed to save study to server');
        }
    }
    async updateStudy(study) {
        try {
            const response = await fetch(`${this.API_URL}/studies/${study.getId()}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(study.toEntity()),
            });
            if (!response.ok) {
                throw new Error('Failed to update study');
            }
            return result_1.Result.ok(undefined);
        }
        catch (error) {
            logger_1.logger.error('Failed to update study on server', { error });
            return result_1.Result.fail('Failed to update study on server');
        }
    }
    async deleteStudy(id) {
        try {
            const response = await fetch(`${this.API_URL}/studies/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete study');
            }
            return result_1.Result.ok(undefined);
        }
        catch (error) {
            logger_1.logger.error('Failed to delete study from server', { error });
            return result_1.Result.fail('Failed to delete study from server');
        }
    }
    async sync() {
        try {
            const response = await fetch(`${this.API_URL}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: this.userId }),
            });
            if (!response.ok) {
                throw new Error('Failed to sync');
            }
            return result_1.Result.ok(undefined);
        }
        catch (error) {
            logger_1.logger.error('Failed to sync with server', { error });
            return result_1.Result.fail('Failed to sync with server');
        }
    }
    async downloadChanges() {
        try {
            const response = await axios_1.default.get(`${this.API_URL}/sync`);
            return result_1.Result.ok(response.data);
        }
        catch (error) {
            logger_1.logger.error('Error downloading changes', { error });
            return result_1.Result.fail('Failed to download changes');
        }
    }
    async uploadChanges(studies) {
        try {
            await axios_1.default.post(`${this.API_URL}/sync`, { studies, timestamp: new Date() });
            return result_1.Result.ok(undefined);
        }
        catch (error) {
            logger_1.logger.error('Error uploading changes', { error });
            return result_1.Result.fail('Failed to upload changes');
        }
    }
    async saveStudies(studies) {
        try {
            const url = `${this.API_URL}/studies/bulk`;
            logger_1.logger.debug('Enviando estudos para o servidor', {
                url,
                count: studies.length,
                firstStudy: studies[0],
                lastStudy: studies[studies.length - 1]
            });
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(studies)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            logger_1.logger.info('Estudos salvos no servidor com sucesso', { count: studies.length });
        }
        catch (error) {
            logger_1.logger.error('Erro ao salvar estudos no servidor', error);
            throw error;
        }
    }
    async findDuplicateStudies(studies) {
        try {
            const existingStudies = await this.getStudies();
            if (!existingStudies.isSuccessful()) {
                return [];
            }
            return studies.filter(study => existingStudies.getValue().some(existing => existing.getDate().getTime() === study.getDate().getTime() &&
                existing.getSubject() === study.getSubject()));
        }
        catch (error) {
            logger_1.logger.error('Error finding duplicate studies', { error });
            return [];
        }
    }
    async clear() {
        await this.clearUserData();
    }
    async clearStudies() {
        try {
            await this.clearUserData();
            return result_1.Result.ok(undefined);
        }
        catch (error) {
            logger_1.logger.error('Error clearing studies', error);
            return result_1.Result.fail(error instanceof Error ? error.message : 'Unknown error clearing studies');
        }
    }
    async getCacheStatus() {
        var _a;
        const studies = await this.getStudies();
        return {
            size: ((_a = studies.getValue()) === null || _a === void 0 ? void 0 : _a.length) || 0,
            lastUpdated: studies.getValue() ? new Date() : new Date(0)
        };
    }
    async bulkUpsertStudies(studies) {
        await this.saveStudies(studies);
    }
    async clearUserData() {
        try {
            const url = `${this.API_URL}/studies`;
            const response = await fetch(url, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error(`Failed to clear user data: ${response.statusText}`);
            }
            logger_1.logger.info('Successfully cleared user data');
        }
        catch (error) {
            logger_1.logger.error('Error clearing user data', error);
            throw error;
        }
    }
    async clearSystemData() {
        try {
            const url = `${this.API_URL}/system`;
            const response = await fetch(url, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error(`Failed to clear system data: ${response.statusText}`);
            }
            logger_1.logger.info('Successfully cleared system data');
        }
        catch (error) {
            logger_1.logger.error('Error clearing system data', error);
            throw error;
        }
    }
    async getStudyCycles() {
        try {
            const response = await axios_1.default.get(`${this.API_URL}/cycles`);
            return result_1.Result.ok(response.data);
        }
        catch (error) {
            logger_1.logger.error('Error getting study cycles', { error });
            return result_1.Result.fail('Failed to get study cycles');
        }
    }
    async saveStudyCycle(cycle) {
        try {
            await axios_1.default.post(`${this.API_URL}/cycles`, cycle);
            return result_1.Result.ok(undefined);
        }
        catch (error) {
            logger_1.logger.error('Error saving study cycle', { error });
            return result_1.Result.fail('Failed to save study cycle');
        }
    }
    async saveStudyCycles(cycles) {
        try {
            await axios_1.default.post(`${this.API_URL}/cycles/bulk`, cycles);
            return result_1.Result.ok(undefined);
        }
        catch (error) {
            logger_1.logger.error('Error saving study cycles', { error });
            return result_1.Result.fail('Failed to save study cycles');
        }
    }
    async clearStudyCycles() {
        try {
            await axios_1.default.delete(`${this.API_URL}/cycles`);
            return result_1.Result.ok(undefined);
        }
        catch (error) {
            logger_1.logger.error('Error clearing study cycles', { error });
            return result_1.Result.fail('Failed to clear study cycles');
        }
    }
    async invalidateCache() {
        // Pode ser só um stub por enquanto
        return result_1.Result.ok(undefined);
    }
}
exports.ServerSyncAdapter = ServerSyncAdapter;
//# sourceMappingURL=ServerSyncAdapter.js.map