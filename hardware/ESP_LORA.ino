#include <SPI.h>
#include <LoRa.h>

// === CONFIG PINS LORA ===
#define LORA_SCK 18
#define LORA_MISO 19
#define LORA_MOSI 23
#define LORA_CS 5
#define LORA_RST 14
#define LORA_DIO0 2

void setup() {
  Serial.begin(9600);      // Comunicação com Arduino
  delay(1000);

  Serial.println("=== ESP32 + LoRa iniciado ===");

  // ---- Inicializa LoRa ----
  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_CS);
  LoRa.setPins(LORA_CS, LORA_RST, LORA_DIO0);

  if (!LoRa.begin(915E6)) {
    Serial.println("❌ Erro ao iniciar LoRa!");
    while (true);
  }
  
  Serial.println("✅ LoRa iniciado com sucesso (915 MHz).");
}

void loop() {
  // ---- RECEBE DADOS DO ARDUINO ----
  if (Serial.available()) {
    String dados = Serial.readStringUntil('\n');
    dados.trim();

    if (dados.length() > 0) {
      Serial.print("📥 Dados recebidos do Arduino: ");
      Serial.println(dados);

      // Envia confirmação de volta ao Arduino
      Serial.println("OK");

      // ---- ENVIA DADOS VIA LORA ----
      Serial.println("📡 Enviando via LoRa...");
      LoRa.beginPacket();
      LoRa.print(dados);
      LoRa.endPacket();

      Serial.println("✅ Pacote enviado via LoRa.");
    }
  }
}
