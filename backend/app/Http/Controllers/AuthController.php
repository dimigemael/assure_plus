<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{

    /**
     * Inscription d'un nouvel utilisateur (Page 22 du PDF)
     * POST /api/register
     */
    public function register(Request $request)
    {
        // 1. Validation des données envoyées par le formulaire
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|string|email|max:150|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'password_confirmation' => 'required|string|min:6',
            // On laisse le choix du role (assure ou expert), par défaut assure
            'role' => 'in:assure,expert,admin',
            // Wallet address requis pour les assurés
            'wallet_address' => 'nullable|string|size:42',
            // Spécialité pour les experts
            'specialite' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            \Log::error('Échec validation inscription:', [
                'errors' => $validator->errors()->toArray(),
                'input' => $request->except(['password', 'password_confirmation'])
            ]);
            return response()->json($validator->errors(), 400);
        }

        // 2. Création de l'utilisateur dans la base de données
        $userData = [
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'password' => Hash::make($request->password), // Toujours hacher le mot de passe !
            'role' => $request->role ?? 'assure',
            'statut' => 'actif'
        ];

        // Ajouter wallet_address si fourni (pour les assurés)
        if ($request->has('wallet_address')) {
            $userData['wallet_address'] = $request->wallet_address;
        }

        // Ajouter specialite si fourni (pour les experts)
        if ($request->has('specialite')) {
            $userData['specialite'] = $request->specialite;
        }

        try {
            $user = User::create($userData);
            \Log::info('Utilisateur créé avec succès:', ['user_id' => $user->id, 'email' => $user->email]);

            // 3. Réponse de succès avec un token immédiat
            $token = Auth::guard('api')->login($user);
            \Log::info('Token JWT généré avec succès', ['token_length' => \strlen($token)]);

            return response()->json([
                'message' => 'Utilisateur créé avec succès',
                'user' => $user,
                'token' => $token
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Erreur lors de la création utilisateur:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Erreur lors de la création du compte',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Connexion et récupération du Token JWT (Page 22 du PDF)
     * POST /api/login
     */
 /**
     * Connexion et récupération du Token JWT
     */
    public function login(Request $request)
    {
        // 1. Validation
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        // 2. On récupère les identifiants
        $credentials = $request->only('email', 'password');

        \Log::info('Tentative de connexion', [
            'email' => $credentials['email']
        ]);

        // Vérifier si l'utilisateur existe
        $user = User::where('email', $credentials['email'])->first();

        if (!$user) {
            \Log::warning('Utilisateur non trouvé', ['email' => $credentials['email']]);
            return response()->json([
                'status' => 'error',
                'message' => 'Email ou mot de passe incorrect',
            ], 401);
        }

        \Log::info('Utilisateur trouvé', [
            'id' => $user->id,
            'role' => $user->role,
            'password_check' => Hash::check($credentials['password'], $user->password)
        ]);

        // 3. LA LIGNE IMPORTANTE (Création du token)
        // On demande au "guard" API de vérifier les infos
        $token = Auth::guard('api')->attempt($credentials);

        \Log::info('Résultat attempt', [
            'token_generated' => !empty($token),
            'token_length' => $token ? strlen($token) : 0
        ]);

        // 4. Si le token est vide (échec connexion)
        if (!$token) {
            \Log::error('Échec génération token JWT', [
                'email' => $credentials['email'],
                'user_exists' => true,
                'password_valid' => Hash::check($credentials['password'], $user->password)
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Email ou mot de passe incorrect',
            ], 401);
        }

        // 5. Si ça marche, on renvoie le token
        \Log::info('Connexion réussie', [
            'user_id' => $user->id,
            'email' => $user->email
        ]);

        return response()->json([
            'status' => 'success',
            'user' => Auth::guard('api')->user(), // On récupère l'user connecté
            'token' => $token, // <--- C'est ici que ça plantait avant car $token n'existait pas
            'type' => 'bearer',
        ]);
    }

    /**
     * Récupérer le profil de l'utilisateur connecté (Page 22 du PDF : GET /api/user)
     */
    public function me()
    {
        return response()->json(Auth::user());
    }

    /**
     * Déconnexion (Invalider le token) (Page 22 du PDF : POST /api/logout)
     */
    public function logout()
    {
        Auth::logout();
        return response()->json([
            'status' => 'success',
            'message' => 'Déconnecté avec succès',
        ]);
    }
}