# api/routers/stripe_integration.py

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from config import STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID_PRO, STRIPE_PRICE_ID_ENTERPRISE, FRONTEND_URL
from utils import verify_token, get_user, save_user
import stripe
import uuid
from datetime import datetime

stripe.api_key = STRIPE_SECRET_KEY

router = APIRouter()


@router.post("/create-checkout-session")
def create_checkout_session(
    user: str = Depends(verify_token), tier: str = "Pro"
):
    try:
        # Determine price ID based on tier
        if tier == "Pro":
            price_id = STRIPE_PRICE_ID_PRO
        elif tier == "Enterprise":
            price_id = STRIPE_PRICE_ID_ENTERPRISE
        else:
            raise HTTPException(status_code=400, detail="Invalid tier selected")

        # Create a Stripe Checkout Session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price": price_id,
                    "quantity": 1,
                },
            ],
            mode="subscription",
            success_url=f"{FRONTEND_URL}",
            cancel_url=f"{FRONTEND_URL}",
            metadata={
                "username": user,
                "tier": tier,
            },
        )
        return {"session": checkout_session}
    except Exception as e:
        print("ERROR:", repr(e), e)
        raise HTTPException(
            status_code=500, detail="Failed to create Stripe checkout session"
        )


@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        print("Webhook signature verification failed.")
        return JSONResponse(status_code=400, content={"detail": "Invalid signature"})
    except Exception as e:
        print("Webhook error:", str(e))
        return JSONResponse(status_code=400, content={"detail": "Webhook error"})

    print("Webhook received:", event["type"])
    # Handle the checkout.session.completed event
    if event["type"] == "checkout.session.completed":
        session_obj = event["data"]["object"]
        handle_checkout_session(session_obj)

    return JSONResponse(status_code=200, content={"detail": "Webhook received"})


def handle_checkout_session(session_obj):
    # Retrieve the metadata to get the username and tier
    username = session_obj.get("metadata", {}).get("username")
    tier = session_obj.get("metadata", {}).get("tier")
    print(f"Checkout session completed for {username} with tier {tier}")
    if not username or not tier:
        print("Username or tier not found in session metadata.")
        return

    try:
        # Update the user's tier in DynamoDB
        user_data = get_user(username)
        user_data["tier"] = tier
        save_user(user_data)
        print(f"User {username} upgraded to {tier}.")
    except Exception as e:
        print(f"Error updating user tier: {str(e)}")
