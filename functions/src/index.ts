import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import path from "path";

admin.initializeApp();

const app = express();

app.use(express.json());
app.use(cors());
app.use(
    "/favicon.ico",
    express.static(path.join(__dirname, "public", "favicon.ico"))
);

app.post("/createUser", async (req, res) => {
    const {email, password, ...userInfoWithoutPassword} = req.body;
    try {
        let uid;
        try {
            const userRecord = await admin.auth().getUserByEmail(email);
            uid = userRecord.uid;
        } catch (error) {
            if (error instanceof Error &&
                error.name === "auth/user-not-found") {
                const userRecord = await admin.auth()
                    .createUser({email, password});
                uid = userRecord.uid;
            } else {
                throw error;
            }
        }
        await admin
            .firestore()
            .collection("usuarios")
            .doc(uid)
            .set({email, ...userInfoWithoutPassword});
        res.status(200).send("Usuario creado con éxito");
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).send(error.message);
        } else {
            res.status(500).send("Ocurrió un error desconocido");
        }
    }
});

app.delete("/deleteUser", async (req, res) => {
    const {uid} = req.body;
    try {
        await admin.firestore().collection("usuarios").doc(uid).delete();
        res.status(200).send({message: "Usuario eliminado exitosamente"});
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error al eliminar el usuario: ", error.message);
            res.status(500).send({
                message: "Error al eliminar desde el servidor: " +
                    error.message,
            });
        } else {
            console.error("Error al eliminar el usuario: ", error);
            res
                .status(500)
                .send({
                    message: "Error al eliminar desde el servidor: ",
                    error,
                });
        }
    }
});

app.get("/checkDni/:dni", async (req, res) => {
    const {dni} = req.params;
    try {
        const snapshot = await admin
            .firestore()
            .collection("usuarios")
            .where("dni", "==", dni)
            .get();
        if (!snapshot.empty) {
            res.json({exists: true});
        } else {
            res.json({exists: false});
        }
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).send(error.message);
        } else {
            res.status(500).send("Ocurrió un error desconocido");
        }
    }
});

app.get("/checkUser/:email", async (req, res) => {
    const {email} = req.params;
    try {
        const snapshot = await admin
            .firestore()
            .collection("usuarios")
            .where("email", "==", email)
            .get();
        if (!snapshot.empty) {
            res.json({exists: true});
        } else {
            res.json({exists: false});
        }
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).send(error.message);
        } else {
            res.status(500).send("Ocurrió un error desconocido");
        }
    }
});

app.get("/", (req, res) => {
    res.send("Servidor funcionando correctamente en http://localhost:3001");
});

app.listen(3001, () => {
    console.log("Servidor corriendo en http://localhost:3001");
});
