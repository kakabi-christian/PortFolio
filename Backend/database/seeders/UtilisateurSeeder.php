<?php

namespace Database\Seeders;

use App\Models\Utilisateur;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UtilisateurSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Utilisateur::create([
            'name' => 'Kakabi Christian',
            'email' => 'kakabichristian@gmail.com',
            'password' => Hash::make('tkkc2006'),
            'role' => 'admin',
        ]);
    }
}
