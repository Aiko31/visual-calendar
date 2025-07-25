// script.js

const timeOptions = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    const t = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    timeOptions.push(t);
  }
}

function timeToIndex(timeStr) {
  const [hour, minute] = timeStr.split(':').map(Number);
  return (hour * 60 + minute) / 15;
}

function populateTimeSelect(select, disableBeforeTime = null) {
  select.innerHTML = '';
  timeOptions.forEach(time => {
    const opt = document.createElement('option');
    opt.value = time;
    opt.text = time;
    if (disableBeforeTime && time < disableBeforeTime) {
      opt.disabled = true;
    }
    select.appendChild(opt);
  });
}

function addTimeSlot(tabId) {
  const timeSlotGroup = document.getElementById(`timeSlots-${tabId}`);
  const existingRows = timeSlotGroup.querySelectorAll('.form-group.row');
  const isFirst = existingRows.length === 0;
  const lastRow = existingRows[existingRows.length - 1]?.querySelector('select[name="end_time[]"]');
  const lastEndTime = lastRow?.value || null;

  const row = document.createElement('div');
  row.className = 'form-group row';
  row.innerHTML = `
    <div class="col-6">
      ${isFirst ? '<label class="form-label">Start Time</label>' : ''}
      <select name="start_time[]" class="form-control time-select"></select>
    </div>
    <div class="col-6">
      ${isFirst ? '<label class="form-label">End Time</label>' : ''}
      <select name="end_time[]" class="form-control time-select"></select>
    </div>
  `;

  const selects = row.querySelectorAll('select');
  populateTimeSelect(selects[0], lastEndTime);
  populateTimeSelect(selects[1]);
  selects[0].value = lastEndTime || '';
  selects[1].value = lastEndTime || '';

  timeSlotGroup.appendChild(row);
  updateVisualizationFromInputs(tabId);
}

function renderTimeViz(containerId, activeRanges) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  const labels = [
    ['0:00', '1:00', '2:00', '3:00', '4:00', '5:00'],
    ['6:00', '7:00', '8:00', '9:00', '10:00', '11:00'],
    ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
    ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00']
    ];

  for (let block = 0; block < 4; block++) {
    // ✅ ラベル行を作る
    const labelRow = document.createElement('div');
    labelRow.className = 'time-visualization-label-row';
    labels[block].forEach(labelText => {
      const label = document.createElement('div');
      label.className = 'time-visualization-label';
      label.innerText = labelText;
      labelRow.appendChild(label);
    });
    container.appendChild(labelRow);

    // ✅ スロット表示部分
    const rowDiv = document.createElement('div');
    rowDiv.className = 'time-visualization-row';
    for (let i = block * 24; i < (block + 1) * 24; i++) {
      const div = document.createElement('div');
      div.className = 'slot';
      const isActive = activeRanges.some(([start, end]) => i >= start && i < end);
      if (isActive) {
        div.classList.add('active');
      } else {
        div.classList.add(block < 1 || block > 2 ? 'inactive-night' : 'inactive-day');
      }
      rowDiv.appendChild(div);
    }

    container.appendChild(rowDiv);
  }
}

function updateVisualizationFromInputs(tabId) {
  const timeSlotGroup = document.getElementById(`timeSlots-${tabId}`);
  const rows = timeSlotGroup.querySelectorAll('.form-group.row');
  const ranges = [];

  rows.forEach(row => {
    const selects = row.querySelectorAll('select');
    const start = selects[0]?.value;
    const end = selects[1]?.value;
    if (start && end) {
      const startIndex = timeToIndex(start);
      const endIndex = timeToIndex(end);
      if (startIndex < endIndex) {
        ranges.push([startIndex, endIndex]);
      }
    }
  });

  renderTimeViz(`timeViz-${tabId}`, ranges);
}

function initializeTab(tabId) {
  const selects = document.querySelectorAll(`#timeSlots-${tabId} .time-select`);
  selects.forEach(select => populateTimeSelect(select));
  updateVisualizationFromInputs(tabId);
}

document.addEventListener('DOMContentLoaded', function () {
  ['weekday', 'date'].forEach(tab => {
    initializeTab(tab);
    addTimeSlot(tab);
  });
});

document.addEventListener('change', function (e) {
  if (e.target.name === 'start_time[]') {
    const startSelect = e.target;
    const startTime = startSelect.value;
    const row = startSelect.closest('.form-group.row');
    const endSelect = row.querySelector('select[name="end_time[]"]');
    if (endSelect) {
      populateTimeSelect(endSelect, startTime);
      endSelect.value = startTime;
    }
  }

  if (e.target.classList.contains('time-select')) {
    const tabId = e.target.closest('.tab-pane').id;
    updateVisualizationFromInputs(tabId);
  }
});
