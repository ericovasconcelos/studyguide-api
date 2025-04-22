"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCleanupService = exports.ServerDataTypes = exports.LocalDataTypes = exports.CleanupScope = void 0;
var CleanupScope;
(function (CleanupScope) {
    CleanupScope["LOCAL"] = "local";
    CleanupScope["SERVER"] = "server";
})(CleanupScope || (exports.CleanupScope = CleanupScope = {}));
var LocalDataTypes;
(function (LocalDataTypes) {
    LocalDataTypes["USER_SETTINGS"] = "user_settings";
    LocalDataTypes["APPLICATION_DATA"] = "application_data";
    LocalDataTypes["ALL_LOCAL"] = "all_local";
})(LocalDataTypes || (exports.LocalDataTypes = LocalDataTypes = {}));
var ServerDataTypes;
(function (ServerDataTypes) {
    ServerDataTypes["USER_DATA"] = "user_data";
    ServerDataTypes["SYSTEM_DATA"] = "system_data";
    ServerDataTypes["ALL_SERVER"] = "all_server";
})(ServerDataTypes || (exports.ServerDataTypes = ServerDataTypes = {}));
class DataCleanupService {
    constructor(storageAdapter, serverSyncAdapter) {
        this.storageAdapter = storageAdapter;
        this.serverSyncAdapter = serverSyncAdapter;
    }
    async cleanupLocalData(types) {
        const result = {
            success: true,
            message: 'Limpeza local concluída com sucesso',
            details: {}
        };
        try {
            for (const type of types) {
                switch (type) {
                    case LocalDataTypes.USER_SETTINGS:
                        await this.clearUserSettings();
                        result.details[LocalDataTypes.USER_SETTINGS] = 1;
                        break;
                    case LocalDataTypes.APPLICATION_DATA:
                        await this.clearApplicationData();
                        result.details[LocalDataTypes.APPLICATION_DATA] = 1;
                        break;
                    case LocalDataTypes.ALL_LOCAL:
                        await this.clearAllLocalData();
                        result.details[LocalDataTypes.ALL_LOCAL] = 1;
                        break;
                }
            }
        }
        catch (error) {
            result.success = false;
            result.message = `Erro durante a limpeza local: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        }
        return result;
    }
    async cleanupServerData(types) {
        const result = {
            success: true,
            message: 'Limpeza do servidor concluída com sucesso',
            details: {}
        };
        try {
            for (const type of types) {
                switch (type) {
                    case ServerDataTypes.USER_DATA:
                        await this.clearUserServerData();
                        result.details[ServerDataTypes.USER_DATA] = 1;
                        break;
                    case ServerDataTypes.SYSTEM_DATA:
                        await this.clearSystemServerData();
                        result.details[ServerDataTypes.SYSTEM_DATA] = 1;
                        break;
                    case ServerDataTypes.ALL_SERVER:
                        await this.clearAllServerData();
                        result.details[ServerDataTypes.ALL_SERVER] = 1;
                        break;
                }
            }
        }
        catch (error) {
            result.success = false;
            result.message = `Erro durante a limpeza do servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        }
        return result;
    }
    async clearUserSettings() {
        // Limpa configurações do usuário no localStorage
        localStorage.removeItem('userPreferences');
        localStorage.removeItem('granToken');
        localStorage.removeItem('themeSettings');
    }
    async clearApplicationData() {
        // Limpa dados da aplicação no IndexedDB
        const result = await this.storageAdapter.clearStudies();
        if (result.failed()) {
            throw new Error(result.getError());
        }
    }
    async clearAllLocalData() {
        // Limpa todos os dados locais
        await this.clearUserSettings();
        await this.clearApplicationData();
        localStorage.clear();
    }
    async clearUserServerData() {
        // Limpa dados do usuário no servidor
        await this.serverSyncAdapter.clearUserData();
    }
    async clearSystemServerData() {
        // Limpa dados do sistema no servidor
        await this.serverSyncAdapter.clearSystemData();
    }
    async clearAllServerData() {
        // Limpa todos os dados do servidor
        await this.clearUserServerData();
        await this.clearSystemServerData();
    }
}
exports.DataCleanupService = DataCleanupService;
//# sourceMappingURL=DataCleanupService.js.map