interface Row {
  status: Status;
  teacherName: string;
  dateTimeString: string;
}

type Status = 'Draft' | 'Past' | 'Deleted';

interface AdminApiResponse {
  items: ActivityItem[];
}

interface ActivityItem {
  actor: Actor;
  events: Event[];
}

interface Actor {
  email: string;
}

interface Event {
  parameters: Parameter[];
}

interface Parameter {
  name: string;
  value: string;
}

const spreadsheet = SpreadsheetApp.openById(
  '1T91pL4zgP5mVETi6_gvQlWsk8rYFYXoD4d97Uv5Jo9Y',
);

function parseRows(rawRows: Object[][]): Row[] {
  const statusColumnIndex = 0;
  const teacherColumnIndex = 3;
  const dateTimeColumnIndex = 4;

  // Verify headers
  if (
    rawRows[0][statusColumnIndex] !== 'Status' ||
    rawRows[0][teacherColumnIndex] !== 'Teacher' ||
    rawRows[0][dateTimeColumnIndex] !== 'Date Time'
  ) {
    throw Error(`Headers have changed: please update script`);
  }

  return (
    rawRows
      // Drop header row
      .slice(1)
      .map(rawRow => ({
        status: rawRow[statusColumnIndex] as Status,
        teacherName: rawRow[teacherColumnIndex] as string,
        dateTimeString: rawRow[dateTimeColumnIndex] as string,
      }))
  );
}

function getGoogleActivities(
  startTimeMillisSinceEpoch: number,
  endTimeMillisSinceEpoch: number,
): AdminApiResponse {
  return AdminReports.Activities.list('all', 'meet', {
    startTime: new Date(startTimeMillisSinceEpoch).toISOString(),
    endTime: new Date(endTimeMillisSinceEpoch).toISOString(),
  });
}

function main() {
  const codeRows = parseRows(
    spreadsheet
      .getSheetByName('classes')
      .getDataRange()
      .getValues(),
  );

  const participantEmails = codeRows
    .filter(row => row.status === 'Past')
    // For testing purposes only look at 3 classes
    .slice(3)
    .map(row => {
      const scheduledTimeMillisSinceEpoch = new Date(
        row.dateTimeString,
      ).getTime();
      // Set startTime to 10min before scheduled time
      const startTimeMillisSinceEpoch =
        scheduledTimeMillisSinceEpoch - 10 * 60 * 1000;
      // Classes generally end 20min after scheduled time; we set endTime to be 30min after
      const endTimeMillisSinceEpoch =
        scheduledTimeMillisSinceEpoch + 30 * 60 * 1000;

      return getGoogleActivities(
        startTimeMillisSinceEpoch,
        endTimeMillisSinceEpoch,
      ).items[0].actor.email;
    });

  spreadsheet
    .getSheetByName('test')
    .getRange('A1')
    .setValue(participantEmails.join(','));
}
