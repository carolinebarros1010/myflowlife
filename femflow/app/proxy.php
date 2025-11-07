<?php
  header("Access-Control-Allow-Origin: *");
  header("Content-Type: application/json");

  $input = file_get_contents("php://input");
  $script = "https://script.google.com/macros/s/AKfycby1OydWK-Akw0zx0QqKJfZS7tc28ziSfpIN8lF4thtEEifWaLUTKKtBBAy1q_nhy3ot/exec";

  $ch = curl_init($script);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
  curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
  $response = curl_exec($ch);
  curl_close($ch);

  echo $response;
?>
