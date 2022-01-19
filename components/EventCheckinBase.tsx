import { useRecoilValue } from "recoil";
import { profile_state } from "recoil/state";
import styles from "../styles/Home.module.css";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import axios from "axios";

const EventCheckinBase = () => {
  const user = useRecoilValue(profile_state);
  const router = useRouter();


  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [check, setCheck] = useState(false);

  const [data, setData] = useState("");

  const [eventName, setEventName] = useState("");

  const submit = async () => {

    const payload = {
      code: data,
      cognito_id: user.user_id,
    }

    setLoading(true);
    setCheck(true);
    const res = await axios.put(router.basePath + "/api/event", payload);

    setSuccess(res.data.status);
    if (res.data.status) {
      setEventName(res.data.event.EventName);
    }
    setLoading(false);
  }

  return (
    <a
      className={styles.card}
    >
      <h2>Checkin Status&rarr;</h2>
      <p>{check ? loading ? "loading..." : success ? `Checked In! to ${eventName}` : "Failed!" : ""}</p>

      <TextField
        id="outlined-basic"
        label="Check In Code"
        variant="outlined"
        onChange={(e) => {
          setData(e.target.value);
        }}
      />
      <Button style={{ marginTop: 10, marginLeft: 10 }} color="primary" onClick={submit}>
        Submit
      </Button>
    </a>
  );
};

export default EventCheckinBase;