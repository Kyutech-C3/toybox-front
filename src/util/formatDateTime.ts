export const formatDateTime = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const pad = (value: number): string => value.toString().padStart(2, "0");

  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
