from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import methods

# Models
class PlantCreate(BaseModel):
    name: str
    interval: int
    owner_id: int
    image: str | None = None

class ChoreCreate(BaseModel):
    name: str
    interval: int
    worker_id: int

class SetAvailability(BaseModel):
    person_id: int
    is_available: int
    unavailable_since: int | None = None
    unavailable_until: int | None = None

class PlantUpdate(BaseModel):
    name: str
    interval: int
    owner_id: int

class ChoreUpdate(BaseModel):
    name: str
    interval: int
    rotation_enabled: int
    rotation_order: str | None = None
    worker_id: int | None = None

class PushSubscription(BaseModel):
    person_id: int
    endpoint: str
    p256dh: str
    auth: str

# Endpoints

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Im Development ruhig offen lassen
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return "Hello World!"

@app.get("/persons")
async def read_persons():
    return methods.getAllPersons()

@app.get("/persons/{person_id}")
async def read_singlePerson(person_id: int):
    return methods.getPersonById(person_id)

@app.patch("/persons/setAvailability/")
async def setPersonAvailability(data: SetAvailability):
    return methods.setPersonAvailability(person_id=data.person_id, is_available=data.is_available, until_timestamp=data.unavailable_until, since_timestamp=data.unavailable_since)

@app.get("/dashboard/{person_id}")
async def read_dashboard(person_id: int):
    return methods.getDashboardForPerson(person_id)

@app.patch("/plant/{plant_id}/water")
async def markPlantWatered(plant_id: int):
    updated = methods.markPlantWatered(plant_id)
    if not updated:
        raise HTTPException(404, "Plant was not watered.")
    return {"success": "watered"}
@app.patch("/chore/{chore_id}/done")
async def markChoreDone(chore_id: int):
    updated = methods.markChoreDone(chore_id)
    if not updated:
        raise HTTPException(404, "Chore was not done.")
    return {"success": "done"}

@app.post("/plant/create/")
async def createPlant(data: PlantCreate):
    updated = methods.addPlant(data.name, data.interval, data.owner_id, data.image)
    if not updated:
        raise HTTPException(404, "Plant not created,")
    return {"status": "Plant created successfully."}

@app.post("/chore/create/")
async def createChore(data: ChoreCreate):
    updated = methods.addChore(data.name, data.interval, data.worker_id)
    if not updated:
        raise HTTPException(404, "Chore not created.")
    return {"status": "Chore created successfully."}

@app.delete("/plant/delete/{plant_id}")
async def deletePlant(plant_id: int):
    updated = methods.removePlant(plant_id)
    if not updated:
        raise HTTPException(404, "Plant not deleted.")
    return {"status": "Plant deleted successfully."}
@app.delete("/chore/delete/{chore_id}")
async def deleteChore(chore_id: int):
    updated = methods.removeChore(chore_id)
    if not updated:
        raise HTTPException(404, "Chore not deleted.")
    return {"status": "Chore deleted successfully."}

class PlantUpdate(BaseModel):
    name: str
    interval: int
    owner_id: int

class ChoreUpdate(BaseModel):
    name: str
    interval: int
    rotation_enabled: int
    rotation_order: str | None = None
    worker_id: int | None = None

# Add these endpoints:

@app.get("/plants/person/{person_id}")
async def get_plants_of_person(person_id: int):
    plants = methods.getPlantsOfPerson(person_id)
    if plants is None:
        raise HTTPException(404, "No plants found")
    return plants

@app.get("/chores/person/{person_id}")
async def get_chores_of_person(person_id: int):
    chores = methods.getChoresOfPerson(person_id)
    if chores is None:
        raise HTTPException(404, "No chores found")
    return chores

@app.post("/plant/create")
async def create_plant(data: PlantCreate):
    plant_id = methods.addPlant(data.name, data.interval, data.owner_id, data.image)
    if not plant_id:
        raise HTTPException(400, "Plant not created")
    return {"status": "Plant created successfully", "id": plant_id}

@app.patch("/plant/update/{plant_id}")
async def update_plant(plant_id: int, data: PlantUpdate):
    # You'll need to create this method in methods.py
    updated = methods.updatePlant(plant_id, data.name, data.interval, data.owner_id)
    if not updated:
        raise HTTPException(404, "Plant not updated")
    return {"status": "Plant updated successfully"}

@app.post("/chore/create")
async def create_chore(data: ChoreUpdate):
    chore_id = methods.addChoreWithRotation(
        data.name, 
        data.interval, 
        data.rotation_enabled,
        data.rotation_order,
        data.worker_id
    )
    if not chore_id:
        raise HTTPException(400, "Chore not created")
    return {"status": "Chore created successfully", "id": chore_id}

@app.patch("/chore/update/{chore_id}")
async def update_chore(chore_id: int, data: ChoreUpdate):
    updated = methods.updateChore(
        chore_id,
        data.name,
        data.interval,
        data.rotation_enabled,
        data.rotation_order,
        data.worker_id
    )
    if not updated:
        raise HTTPException(404, "Chore not updated")
    return {"status": "Chore updated successfully"}

@app.post("/push/subscribe")
async def subscribe_push(data: PushSubscription):
    try:
        methods.addPushSubscription(
            data.person_id,
            data.endpoint,
            data.p256dh,
            data.auth
        )
        return {"status": "subscribed"}
    except Exception as e:
        raise HTTPException(400, str(e))

@app.get("/push/vapid-public-key")
async def get_vapid_public_key():
    """Return the VAPID public key in browser-friendly base64url (uncompressed point) format.

    The VAPID_PUBLIC_KEY env var may contain a base64 (DER/SPKI) representation (from OpenSSL).
    We try to extract the raw uncompressed EC point and return it as base64url (no padding),
    which is the format browsers expect for applicationServerKey.
    """
    import base64

    v = os.getenv('VAPID_PUBLIC_KEY')
    if not v:
        return {"publicKey": None}

    try:
        der = base64.b64decode(v)
        # Prefer using cryptography if available for robust parsing
        try:
            from cryptography.hazmat.primitives.serialization import load_der_public_key, Encoding, PublicFormat

            pub = load_der_public_key(der)
            raw = pub.public_bytes(encoding=Encoding.X962, format=PublicFormat.UncompressedPoint)
        except Exception:
            # Fallback: many SPKI DER exports have the uncompressed point at the end
            if len(der) >= 65 and der[-65] == 0x04:
                raw = der[-65:]
            else:
                # As a last resort, assume the provided value is already the correct raw key
                raw = der

        raw_b64url = base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")
        return {"publicKey": raw_b64url}
    except Exception:
        # If anything fails, return the original env value (best-effort)
        return {"publicKey": v}