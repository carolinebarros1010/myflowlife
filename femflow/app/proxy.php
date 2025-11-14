<?php
// Permite acesso de qualquer origem (CORS)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Lida com o preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

// Define tipo de resposta
header("Content-Type: application/json");

// Lê o corpo da requisição
$input = file_get_contents("php://input");

// URL do seu Apps Script
$script = "https://script.google.com/macros/s/AKfycbwMdVo_TgYGg5mj5W4wcP1yD2PXRcLkA4tZRcc9TdSe363qIvm29odXkAGyPMIJR0xf/exec";

// Envia o POST ao Apps Script
$ch = curl_init($script);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
$response = curl_exec($ch);

// Fecha conexão
curl_close($ch);

// Retorna resposta do Apps Script
echo $response;
?>
