#include <SoftwareSerial.h>

// === CONFIGURAÇÕES DE PINOS ===
#define BT_RX 11  // RX do Arduino <- TX do HC-05
#define BT_TX 10  // TX do Arduino -> RX do HC-05

SoftwareSerial bluetooth(BT_RX, BT_TX); // RX, TX

// === VARIÁVEIS DE ESTADO ===
bool obdConectado = false;
bool espConectado = false;
unsigned long ultimoEnvio = 0;
const unsigned long intervaloEnvio = 2000; // Envia a cada 2 segundos

void setup() {
  Serial.begin(9600);         // Comunicação com ESP32 / Serial Monitor
  bluetooth.begin(9600);      // Comunicação com HC-05
  delay(2000);

  Serial.println("=== Sistema OBD-II + Arduino + HC-05 ===");
  Serial.println("Inicializando Bluetooth...");

  // Tentativa de conexão com OBD-II
  conectarOBD();
}

void loop() {
  // Lê dados do OBD-II (via Bluetooth)
  if (bluetooth.available()) {
    String dadosOBD = bluetooth.readStringUntil('\n');
    dadosOBD.trim();

    if (dadosOBD.length() > 0) {
      Serial.print("Dados recebidos do OBD-II: ");
      Serial.println(dadosOBD);

      // Marca que OBD está ativo
      obdConectado = true;

      // Envia dados ao ESP32
      enviarParaESP(dadosOBD);
    }
  }

  // Verifica timeout de conexão com OBD-II
  if (millis() - ultimoEnvio > 5000) {
    if (!obdConectado) {
      Serial.println("⚠️ Nenhum dado recebido do OBD-II nos últimos 5s. Tentando reconectar...");
      conectarOBD();
    }
    ultimoEnvio = millis();
    obdConectado = false;
  }
}

void conectarOBD() {
  Serial.println("Tentando conectar com o OBD-II...");
  bluetooth.println("ATZ");  // Reset no OBD-II
  delay(1000);
  bluetooth.println("ATE0"); // Desativa eco
  delay(500);
  bluetooth.println("ATL0"); // Desativa linhas longas
  delay(500);
  bluetooth.println("ATI");  // Pede identificação do adaptador
  delay(1000);

  // Lê resposta do OBD
  String resposta = "";
  while (bluetooth.available()) {
    resposta += bluetooth.readString();
  }

  if (resposta.length() > 0) {
    Serial.print("Resposta OBD-II: ");
    Serial.println(resposta);

    if (resposta.indexOf("ELM327") != -1) {
      Serial.println("✅ OBD-II detectado e conectado com sucesso!");
      obdConectado = true;
    } else {
      Serial.println("❌ Falha na comunicação com o OBD-II.");
      obdConectado = false;
    }
  } else {
    Serial.println("❌ Nenhuma resposta do OBD-II.");
    obdConectado = false;
  }
}

void enviarParaESP(String dados) {
  Serial.println("Enviando dados ao ESP32...");
  Serial.println(dados); // Isso é o que o ESP32 lerá na Serial

  // Aqui poderíamos confirmar o envio se o ESP32 responder algo
  // Exemplo: ESP32 envia "OK" de volta
  delay(200);
  if (Serial.available()) {
    String respostaESP = Serial.readStringUntil('\n');
    respostaESP.trim();
    if (respostaESP == "OK") {
      espConectado = true;
      Serial.println("✅ Dados confirmados pelo ESP32.");
    } else {
      espConectado = false;
      Serial.println("⚠️ ESP32 não confirmou o recebimento.");
    }
  }
}
