import React from "react";

import { DayjsEvent } from "../../hooks/useStore";
import Button from "../core/Button";
import Col from "../core/Col";
import InfoBlurb from "../core/InfoBlurb";
import Modal from "../core/Modal";
import Spacer from "../core/Spacer";

type Props = {
  isOpen: boolean,
  onClose: () => void,
  onConfirm: () => void,
  overlappingEvents: DayjsEvent[]
}

export default React.memo(({ isOpen, onClose, onConfirm, overlappingEvents }: Props) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Time Conflict" side="right">
      {() => (
        <Col padding={20}>
          <InfoBlurb>
            This event overlaps with:
            {overlappingEvents.map((event) => (
              <div key={event.event_id}>
                <br />• {event.name}
                <br />
                {event.start_datetime.format("MMM D, h:mm A")} -{" "}
                {event.end_datetime?.format("h:mm A") ?? "onwards"}
              </div>
            ))}
            <br />
            <br />
            Are you sure you want to schedule this event anyway?
          </InfoBlurb>

          <Spacer size={16} />

          <Button isPrimary onClick={onConfirm}>
            Schedule Anyway
          </Button>

          <Spacer size={8} />

          <Button onClick={onClose}>Cancel</Button>
        </Col>
      )}
    </Modal>
  );
});
