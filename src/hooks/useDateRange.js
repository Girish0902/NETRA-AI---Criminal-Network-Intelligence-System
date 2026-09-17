import { useEffect, useState } from "react";

export default function useDateRange() {
  const [dateRange, setDateRange] = useState(
    () => localStorage.getItem("NETRA-date-range") || "12"
  );

  useEffect(() => {
    const handleDateChange = (event) => {
      setDateRange(event.detail);
    };

    window.addEventListener(
      "NETRA-date-range-change",
      handleDateChange
    );

    return () => {
      window.removeEventListener(
        "NETRA-date-range-change",
        handleDateChange
      );
    };
  }, []);

  return dateRange;
}