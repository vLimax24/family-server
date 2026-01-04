from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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