// src/Components/TierUpgrade.js

import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardContent,
  Typography,
  CardActions,
  Button,
} from "@mui/material";
import { loadStripe } from "@stripe/stripe-js";
import api from "../Services/api";
import { useNavigate } from "react-router-dom";

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const TierUpgrade = ({ open, onClose }) => {
  const navigate = useNavigate();

  const handleProUpgrade = async () => {
    try {
      // Create a Stripe Checkout Session
      const response = await api.post("/create-checkout-session", {
        tier: "pro",
      });
      const { session } = response.data;

      console.log("session", session);

      if (session.id) {
        const stripe = await stripePromise;
        await stripe.redirectToCheckout({ sessionId: session.id });
      } else {
        alert("Failed to create Stripe session.");
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      // Optionally, display an error message to the user
    }
  };

  const handleEnterpriseUpgrade = () => {
    navigate("/upgrade-enterprise");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Upgrade Your Subscription</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {/* Pro Tier Card */}
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  Pro
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  $10/month
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={2}>
                  Version tree, Automatic logging and eval, 50 tests max in test
                  set
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleProUpgrade}
                >
                  Upgrade to Pro
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Enterprise Tier Card */}
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  Enterprise
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Custom Pricing
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={2}>
                  Automated test set generation, No limit on test set, Automatic
                  prompt optimization
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleEnterpriseUpgrade}
                >
                  Contact Sales
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

TierUpgrade.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TierUpgrade;
