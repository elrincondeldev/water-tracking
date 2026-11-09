CREATE TRIGGER `node_events_no_update` BEFORE UPDATE ON `node_events`
BEGIN
	SELECT RAISE(ABORT, 'node_events is append-only');
END;
--> statement-breakpoint
CREATE TRIGGER `node_events_no_delete` BEFORE DELETE ON `node_events`
BEGIN
	SELECT RAISE(ABORT, 'node_events is append-only');
END;
