import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import methods
from contextlib import asynccontextmanager
from scheduler import start_scheduler

scheduler = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global scheduler
    scheduler = start_scheduler()
    yield
    # Shutdown
    if scheduler:
        scheduler.shutdown()

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
    allow_origins=[
        "https://192.168.2.160",
        "https://localhost",
        "http://localhost:3000"  # For development
    ],
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

@app.get("/history/today/{person_id}")
async def get_today_completion_history(person_id: int):
    """Get today's completed tasks for a person"""
    return methods.getTodayCompletionHistory(person_id)

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
    """Return the VAPID public key for browser subscription"""
    from py_vapid import Vapid01
    import base64
    from cryptography.hazmat.primitives import serialization
    
    vapid_private_key_path = os.path.join(os.path.dirname(__file__), 'private_key.pem')
    
    vapid = Vapid01()
    
    if not os.path.exists(vapid_private_key_path):
        vapid.generate_keys()
        vapid.save_key(vapid_private_key_path)
    else:
        vapid = Vapid01.from_file(vapid_private_key_path)
    
    if vapid.public_key is None:
        raise HTTPException(500, "Failed to load VAPID public key")
    
    public_bytes = vapid.public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    public_b64 = base64.urlsafe_b64encode(public_bytes).rstrip(b'=').decode('utf-8')
    
    return {"publicKey": public_b64}


@app.post("/push/test/{person_id}")
async def send_test_push(person_id: int):
    """Send a test push notification to a specific person"""
    try:
        methods.sendPushNotification(
            person_id=person_id,
            title="🧪 Test Notification",
            body=f"Test notification sent at {time.strftime('%H:%M:%S')}. If you see this, it's working! 🎉"
        )
        return {"status": "notification sent", "person_id": person_id}
    except Exception as e:
        raise HTTPException(400, f"Failed to send notification: {str(e)}")
    
@app.post("/push/send-daily-reminders")
async def trigger_daily_reminders():
    """Manually trigger daily reminders (for testing)"""
    from scheduler import send_daily_reminders
    try:
        send_daily_reminders()
        return {"status": "Reminders sent successfully"}
    except Exception as e:
        raise HTTPException(500, f"Failed to send reminders: {str(e)}")