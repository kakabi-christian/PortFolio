<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Database;
use App\Models\Framework;
use App\Models\Project;
use App\Models\Service;
use App\Models\Tool;
use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StatisticController extends Controller
{
    /**
     * Retourne toutes les statistiques du tableau de bord.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'overview'  => $this->overview(),
                'contacts'  => $this->contactStats(),
                'projects'  => $this->projectStats(),
                'skills'    => $this->skillStats(),
                'services'  => $this->serviceStats(),
                'users'     => $this->userStats(),
                'charts'    => [
                    'contacts_per_month' => $this->contactsPerMonth(),
                    'projects_per_month' => $this->projectsPerMonth(),
                ],
                'latest'    => [
                    'contacts' => $this->latestContacts(),
                    'projects' => $this->latestProjects(),
                ],
            ],
        ]);
    }

    /**
     * Vue d'ensemble : totaux par entité.
     */
    public function overview(): array
    {
        return [
            'total_contacts'   => Contact::count(),
            'total_projects'   => Project::count(),
            'total_services'   => Service::count(),
            'total_frameworks' => Framework::count(),
            'total_databases'  => Database::count(),
            'total_tools'      => Tool::count(),
            'total_users'      => Utilisateur::count(),
        ];
    }

    /**
     * Statistiques des messages de contact.
     */
    private function contactStats(): array
    {
        $total   = Contact::count();
        $read    = Contact::where('is_read', true)->count();
        $replied = Contact::whereNotNull('replied_at')->count();

        return [
            'total'         => $total,
            'unread'        => Contact::where('is_read', false)->count(),
            'read'          => $read,
            'replied'       => $replied,
            'not_replied'   => $total - $replied,
            'reply_rate'    => $total > 0 ? round(($replied / $total) * 100, 1) : 0,
            'today'         => Contact::whereDate('created_at', today())->count(),
            'this_week'     => Contact::where('created_at', '>=', now()->startOfWeek())->count(),
            'this_month'    => Contact::whereMonth('created_at', now()->month)
                                      ->whereYear('created_at', now()->year)
                                      ->count(),
        ];
    }

    /**
     * Statistiques des projets.
     */
    private function projectStats(): array
    {
        return [
            'total'         => Project::count(),
            'featured'      => Project::where('featured', true)->count(),
            'with_github'   => Project::whereNotNull('github_url')->where('github_url', '!=', '')->count(),
            'with_demo'     => Project::whereNotNull('demo_url')->where('demo_url', '!=', '')->count(),
        ];
    }

    /**
     * Statistiques des compétences (frameworks, bases de données, outils).
     */
    private function skillStats(): array
    {
        return [
            'frameworks' => [
                'total'       => Framework::count(),
                'by_category' => Framework::select('category', DB::raw('COUNT(*) as total'))
                                    ->groupBy('category')
                                    ->get(),
                'avg_proficiency' => round((float) Framework::avg('proficiency'), 1),
            ],
            'databases' => [
                'total'   => Database::count(),
                'by_type' => Database::select('type', DB::raw('COUNT(*) as total'))
                                ->groupBy('type')
                                ->get(),
            ],
            'tools' => [
                'total'       => Tool::count(),
                'by_category' => Tool::select('category', DB::raw('COUNT(*) as total'))
                                    ->groupBy('category')
                                    ->get(),
            ],
        ];
    }

    /**
     * Statistiques des services.
     */
    private function serviceStats(): array
    {
        return [
            'total'     => Service::count(),
            'min_price' => Service::min('min_price'),
            'max_price' => Service::max('min_price'),
            'avg_price' => round((float) Service::avg('min_price'), 2),
        ];
    }

    /**
     * Statistiques des utilisateurs.
     */
    private function userStats(): array
    {
        return [
            'total'   => Utilisateur::count(),
            'by_role' => Utilisateur::select('role', DB::raw('COUNT(*) as total'))
                            ->groupBy('role')
                            ->get(),
        ];
    }

    /**
     * Nombre de messages reçus par mois (12 derniers mois).
     */
    private function contactsPerMonth(): array
    {
        return $this->perMonth(Contact::query());
    }

    /**
     * Nombre de projets créés par mois (12 derniers mois).
     */
    private function projectsPerMonth(): array
    {
        return $this->perMonth(Project::query());
    }

    /**
     * Compte les enregistrements par mois sur les 12 derniers mois,
     * en incluant les mois à 0 pour avoir un graphique complet.
     */
    private function perMonth($query): array
    {
        $start = now()->subMonths(11)->startOfMonth();

        $rows = $query
            ->where('created_at', '>=', $start)
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as total")
            ->groupBy('month')
            ->pluck('total', 'month');

        $result = [];
        for ($i = 0; $i < 12; $i++) {
            $key = $start->copy()->addMonths($i)->format('Y-m');
            $result[] = [
                'month' => $key,
                'total' => (int) ($rows[$key] ?? 0),
            ];
        }

        return $result;
    }

    /**
     * 5 derniers messages de contact.
     */
    private function latestContacts()
    {
        return Contact::latest()
            ->take(5)
            ->get(['id', 'sender_name', 'sender_email', 'subject', 'is_read', 'created_at']);
    }

    /**
     * 5 derniers projets.
     */
    private function latestProjects()
    {
        return Project::latest()
            ->take(5)
            ->get(['id', 'title', 'slug', 'image_url', 'featured', 'created_at']);
    }
}