<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('databases', function (Blueprint $table) {
            $table->id();
            // Ajout de ->unique() pour s'assurer qu'un nom de base de données n'existe qu'une seule fois
            $table->string('name')->unique(); 
            $table->enum('type', ['Relationnelle', 'NoSQL']);
            $table->string('level');
            // Ajout de la colonne pour l'icône ou l'image (nullable au cas où ce n'est pas obligatoire)
            $table->string('icon')->nullable(); 
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('databases');
    }
};