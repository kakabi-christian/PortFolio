// src/Services/StatisticService.ts
import api from "./api";
import type {
  Overview,
  StatisticData,
  StatisticResponse,
} from "../Models/Statistic";

const StatisticService = {
  /**
   * Récupère toutes les statistiques du tableau de bord.
   * GET /api/admin/statistics
   */
  async getAll(): Promise<StatisticData> {
    const response = await api.get<StatisticResponse>("/admin/statistics");
    return response.data.data;
  },

  /**
   * Récupère uniquement les totaux (cartes du haut du dashboard).
   * GET /api/admin/statistics/overview
   */
  async getOverview(): Promise<Overview> {
    const response = await api.get<Overview>("/admin/statistics/overview");
    return response.data;
  },
};

export default StatisticService;