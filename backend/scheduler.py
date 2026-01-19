from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import methods
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_daily_reminders():
    """Send push notifications for all due tasks at 8 AM"""
    logger.info("Running daily task reminders...")
    
    # Get all persons
    persons = methods.getAllPersons()
    
    for person in persons:
        person_id = person['id']
        person_name = person['name']
        
        try:
            # Get due tasks for this person
            dashboard = methods.getDashboardForPerson(person_id)
            due_chores = dashboard['dueChores']
            due_plants = dashboard['duePlants']
            
            total_tasks = len(due_chores) + len(due_plants)
            
            # Only send notification if there are tasks
            if total_tasks > 0:
                # Build detailed notification message
                body = build_detailed_message(due_chores, due_plants, person_name)
                
                # Send notification
                methods.sendPushNotification(
                    person_id=person_id,
                    title=f"Guten Morgen, {person_name}! ☀️",
                    body=body
                )
                logger.info(f"Sent detailed reminder to {person_name}: {total_tasks} tasks")
            else:
                # Send "all done" notification
                methods.sendPushNotification(
                    person_id=person_id,
                    title=f"Guten Morgen, {person_name}! ☀️",
                    body="Heute hast du keine Aufgaben! Genieße deinen Tag! 🎉"
                )
                logger.info(f"Sent 'all done' message to {person_name}")
                
        except Exception as e:
            logger.error(f"Failed to send reminder to {person_name}: {e}")
    
    logger.info("Daily reminders completed")


def build_detailed_message(due_chores, due_plants, person_name):
    """Build a detailed message listing all tasks"""
    
    parts = []
    
    # Add chores
    if due_chores:
        chore_count = len(due_chores)
        if chore_count <= 3:
            # List all chores by name
            chore_names = [chore['name'] for chore in due_chores]
            chores_text = format_list(chore_names)
            parts.append(f"Aufgaben: {chores_text}")
        else:
            # Show first 3 and count the rest
            first_three = [chore['name'] for chore in due_chores[:3]]
            remaining = chore_count - 3
            chores_text = format_list(first_three)
            parts.append(f"Aufgaben: {chores_text} und {remaining} weitere")
    
    # Add plants
    if due_plants:
        plant_count = len(due_plants)
        if plant_count <= 3:
            # List all plants by name
            plant_names = [plant['name'] for plant in due_plants]
            plants_text = format_list(plant_names)
            parts.append(f"Pflanzen gießen: {plants_text}")
        else:
            # Show first 3 and count the rest
            first_three = [plant['name'] for plant in due_plants[:3]]
            remaining = plant_count - 3
            plants_text = format_list(first_three)
            parts.append(f"Pflanzen gießen: {plants_text} und {remaining} weitere")
    
    # Combine parts
    if len(parts) == 2:
        # Both chores and plants
        return f"{parts[0]}. {parts[1]}. 🌟"
    elif parts:
        # Only one type
        return f"{parts[0]}! 🌟"
    else:
        return "Du hast heute Aufgaben zu erledigen! 🌟"


def format_list(items):
    """Format a list of items with proper German grammar"""
    if not items:
        return ""
    elif len(items) == 1:
        return items[0]
    elif len(items) == 2:
        return f"{items[0]} und {items[1]}"
    else:
        # "A, B und C"
        return ", ".join(items[:-1]) + f" und {items[-1]}"


def start_scheduler():
    """Start the background scheduler"""
    scheduler = BackgroundScheduler()
    
    # Schedule daily at 8:00 AM
    scheduler.add_job(
        send_daily_reminders,
        CronTrigger(hour=6, minute=0),
        id='daily_reminders',
        name='Send daily task reminders',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler started - daily reminders at 6:00 AM")

    return scheduler