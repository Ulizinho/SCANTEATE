import React from "react";
import { View, Text, Pressable, StyleSheet, Image, StatusBar, ScrollView } from "react-native";
import { router } from "expo-router";
import { AntDesign } from "@expo/vector-icons";

export default function Cuentos() {
  const cuentos = [
    {
      id: 1,
      title: "El Dragon Chef",
      image: require("../assets/images/El Dragon Chef portada.png"),
      pages: [
        { text: "Había una vez un dragón que amaba la cocina...", img: require("../assets/images/dragon/DragónChef - 1.png"), audio: require("../assets/audio/dragon/DragonP1.mp3") },
        { text: "Autores, Ilustración, Colaboradores...", img: require("../assets/images/dragon/DragónChef - 2.png"), audio: require("../assets/audio/dragon/DragonP2.mp3") },
        { text: "Érase un dragón que queria aprender a cocinar...", img: require("../assets/images/dragon/DragónChef - 3.png"), audio: require("../assets/audio/dragon/DragonP3.mp3") },
        { text: "Todas las mañanas, Dragón iba a su carrito para vender maíz ...", img: require("../assets/images/dragon/DragónChef - 4.png"), audio: require("../assets/audio/dragon/DragonP4.mp3") },
        { text: "Un día, Dragón tuvo una idea, Echar pimienta en el maíz ...", img: require("../assets/images/dragon/DragónChef - 5.png"), audio: require("../assets/audio/dragon/DragonP5.mp3") },
        { text: "Dragón, echó pimienta en el maíz... Se formó una nube de pimienta", img: require("../assets/images/dragon/DragónChef - 6.png"), audio: require("../assets/audio/dragon/DragonP6.mp3") },
        { text: "Dragón estornudó y la parrilla se llenó de fuego ...", img: require("../assets/images/dragon/DragónChef - 7.png"), audio: require("../assets/audio/dragon/DragonP6.mp3") },
        { text: "El maíz comenzó a explotar. ¡Pop!, ¡Pop!... Dragón se tapó las orejas", img: require("../assets/images/dragon/DragónChef - 8.png"), audio: require("../assets/audio/dragon/DragonP7.mp3") },
        { text: "El maíz se convirtió en palomitas....", img: require("../assets/images/dragon/DragónChef - 9.png"), audio: require("../assets/audio/dragon/DragonP8.mp3") },
        { text: "Dragón quedó dentro de una montaña de palomitas, Dragón estaba sorprendido. ¿Qué era eso?...", img: require("../assets/images/dragon/DragónChef - 10.png"), audio: require("../assets/audio/dragon/DragonP9.mp3") },
        { text: "Dragón se comió una palomita...¡Está riquísima!...", img: require("../assets/images/dragon/DragónChef - 11.png"), audio: require("../assets/audio/dragon/DragonP10.mp3") },
        { text: "Dragón aprendió que con el maíz puede hacer palomitas...Ahora, podría venderlas en su carrito.", img: require("../assets/images/dragon/DragónChef - 12.png"), audio: require("../assets/audio/dragon/DragonP11.mp3") },
        { text: "A los dragoncitos les gustaban mucho las palomitas...Dragón estaba muy contento...", img: require("../assets/images/dragon/DragónChef - 13.png"), audio: require("../assets/audio/dragon/DragonP12.mp3") },
        { text: "Fin...", img: require("../assets/images/dragon/DragónChef - 14.png"), audio: require("../assets/audio/dragon/DragonP14.mp3") },
      ]
    },
    // Aquí puedes dejar los otros que tenías con su lógica anterior o vacíos
    { id: 2, title: "Un lío de narices", image: require("../assets/images/Un lío de narices portada.png"), pages: [] },
    { id: 3, title: "Un tirón de orejas", image: require("../assets/images/Un tirón de orejas portada.png"), pages: [] },
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0d5692" barStyle="light-content" translucent={true} />
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <AntDesign name="left" size={24} color="#0369a1" />
        </Pressable>
        <Text style={styles.headerTitle}>Biblioteca SCANTEATE</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {cuentos.map((cuento, index) => (
          <Pressable
            key={index}
            style={styles.cuentoCard}
            onPress={() => {
              if (cuento.pages.length > 0) {
                router.push({
                  pathname: '/cuentoViewer',
                  params: { cuentoData: JSON.stringify(cuento) },
                });
              } else {
                alert("Este cuento estará disponible pronto.");
              }
            }}
          >
            <Image source={cuento.image} style={styles.cuentoImage} />
            <View style={styles.cardInfo}>
              <Text style={styles.cuentoTitle}>{cuento.title}</Text>
              <Text style={styles.pageInfo}>{cuento.pages.length} páginas • Con Audio</Text>
            </View>
            <AntDesign name="play" size={24} color="#0c4a6e" />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { paddingTop: 55, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
  backButton: { backgroundColor: "#f1f5f9", padding: 10, borderRadius: 12 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 22, fontFamily: "PlayChickens", color: "#0369a1", marginRight: 40 },
  scrollContent: { padding: 20 },
  cuentoCard: { flexDirection: "row", alignItems: "center", padding: 15, marginBottom: 15, backgroundColor: "#fff", borderRadius: 20, elevation: 3 },
  cuentoImage: { width: 70, height: 70, borderRadius: 15 },
  cardInfo: { flex: 1, marginLeft: 15 },
  cuentoTitle: { fontSize: 18, color: "#0c4a6e", fontFamily: "SuperFeel" },
  pageInfo: { fontSize: 12, color: "#64748b", marginTop: 4 }
});