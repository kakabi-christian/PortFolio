<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouveau message de contact</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #334155;
            background-color: #f1f5f9;
            margin: 0;
            padding: 30px 0;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            border-top: 5px solid #38bdf8;
        }
        .header-section {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 20px;
        }
        h2 {
            color: #0f172a;
            font-size: 22px;
            margin: 0 0 10px 0;
        }
        .subtitle {
            font-size: 14px;
            color: #64748b;
            margin: 0;
        }
        .intro-text {
            font-size: 15px;
            color: #475569;
            margin-bottom: 25px;
        }
        .info-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .info-row {
            margin-bottom: 10px;
            display: flex;
        }
        .info-row:last-child {
            margin-bottom: 0;
        }
        .info-label {
            font-weight: bold;
            color: #475569;
            width: 90px;
            flex-shrink: 0;
        }
        .info-value {
            color: #1e293b;
        }
        .message-box {
            background-color: #ffffff;
            border: 1px solid #cbd5e1;
            padding: 20px;
            border-radius: 8px;
            margin-top: 15px;
            white-space: pre-wrap;
            color: #1e293b;
        }
        .message-title {
            font-weight: bold;
            color: #0ea5e9;
            margin-bottom: 10px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .action-hint {
            margin-top: 25px;
            font-size: 13px;
            color: #64748b;
            background: #f0f9ff;
            padding: 12px;
            border-radius: 6px;
            border-left: 3px solid #0ea5e9;
        }
        .footer {
            margin-top: 35px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #94a3b8;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header-section">
            <h2>Nouveau message de contact</h2>
            <p class="subtitle">Reçu via le formulaire de votre Portfolio professionnel</p>
        </div>

        <p class="intro-text">
            Bonjour <strong>Christian</strong>, un visiteur vient de vous laisser un message depuis votre site web. Voici le récapitulatif de sa demande :
        </p>

        <div class="info-card">
            <div class="info-row">
                <span class="info-label">Nom :</span>
                <span class="info-value">{{ $contactData['sender_name'] }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email :</span>
                <span class="info-value"><a href="mailto:{{ $contactData['sender_email'] }}" style="color: #0ea5e9; text-decoration: none;">{{ $contactData['sender_email'] }}</a></span>
            </div>
            <div class="info-row">
                <span class="info-label">Sujet :</span>
                <span class="info-value"><strong>{{ $contactData['subject'] }}</strong></span>
            </div>

            <div class="message-box">
                <div class="message-title">Contenu du message :</div>
                {{ $contactData['message'] }}
            </div>
        </div>

        <div class="action-hint">
            💡 <strong>Conseil :</strong> Vous pouvez cliquer directement sur le bouton <em>"Répondre"</em> de votre boîte mail pour répondre à cet utilisateur sans avoir à retaper son adresse.
        </div>

        <div class="footer">
            Cet e-mail a été généré automatiquement par le backend Laravel de votre portfolio. Merci de ne pas répondre directement à cette adresse système.
        </div>
    </div>
</body>
</html>