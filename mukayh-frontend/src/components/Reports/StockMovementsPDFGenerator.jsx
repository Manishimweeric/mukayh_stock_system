import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class StockMovementsPDFGenerator {
    static async generateStockMovementsReport(filteredMovements, filters, materials, toast) {
        if (!filteredMovements || filteredMovements.length === 0) {
            toast.warning('No stock movement data to generate report.');
            return;
        }

        const { searchTerm, movementTypeFilter, materialFilter } = filters;

        // Calculate summary statistics
        const calculateSummary = () => {
            let totalIn = 0;
            let totalOut = 0;
            let totalValue = 0;
            let totalMovements = filteredMovements.length;

            filteredMovements.forEach(movement => {
                const quantity = parseFloat(movement.quantity) || 0;
                const value = parseFloat(movement.total_value) || 0;

                if (movement.movement_type === 'IN') {
                    totalIn += quantity;
                } else if (movement.movement_type === 'OUT') {
                    totalOut += quantity;
                }
                totalValue += value;
            });

            return {
                total: totalMovements,
                totalIn: totalIn.toFixed(2),
                totalOut: totalOut.toFixed(2),
                totalValue: totalValue,
                netChange: (totalIn - totalOut).toFixed(2)
            };
        };

        const summary = calculateSummary();

        const getFilterDescription = () => {
            const filterList = [];
            if (searchTerm) filterList.push(`Search: "${searchTerm}"`);
            if (movementTypeFilter !== 'All') filterList.push(`Type: ${movementTypeFilter}`);
            if (materialFilter !== 'All') {
                const material = materials?.find(mat => mat.id == materialFilter);
                if (material) filterList.push(`Material: ${material.name}`);
            }
            return filterList.length === 0 ? null : `${filterList.join(', ')}`;
        };

        const formatDateForReport = (dateString) => {
            if (!dateString) return 'N/A';
            try {
                return new Date(dateString).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (error) {
                return 'Invalid date';
            }
        };

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('rw-RW', {
                style: 'currency',
                currency: 'RWF',
                currencyDisplay: 'symbol',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(Math.round(amount || 0));
        };

        const formatNumber = (num) => {
            return new Intl.NumberFormat().format(Math.round(num || 0));
        };

        const currentDate = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const filterDescription = getFilterDescription();

        const getMovementTypeInfo = (type) => {
            const movementTypes = {
                'IN': { label: 'STOCK IN', color: '#e8f5e9', textColor: '#2e7d32', icon: '↑' },
                'OUT': { label: 'STOCK OUT', color: '#fee', textColor: '#c00', icon: '↓' }
            };
            return movementTypes[type] || { label: type, color: '#f0f0f0', textColor: '#666', icon: '↔' };
        };

        const getMaterialName = (materialId) => {
            if (!materialId) return 'N/A';
            const material = materials?.find(mat => mat.id == materialId);
            return material ? material.name : 'Unknown Material';
        };

        try {
            // Load logo image as base64
            const loadLogo = async () => {
                try {
                    const logoPaths = [
                        '/images/Mukayh.png',
                        '/images/logo.png',
                        '/images/logo.jpg',
                        '/images/logo.jpeg',
                        '/logo.png',
                        '/logo.jpg'
                    ];

                    for (const path of logoPaths) {
                        try {
                            const response = await fetch(path);
                            if (response.ok) {
                                const blob = await response.blob();
                                return await new Promise((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve(reader.result);
                                    reader.onerror = reject;
                                    reader.readAsDataURL(blob);
                                });
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                    return null;
                } catch (error) {
                    console.warn('Could not load logo:', error);
                    return null;
                }
            };

            const logoBase64 = await loadLogo();

            // Calculate records per page
            const recordsFirstPage = 12;
            const recordsOtherPages = 20;

            let totalPages = 1;
            if (filteredMovements.length > recordsFirstPage) {
                const remaining = filteredMovements.length - recordsFirstPage;
                totalPages = 1 + Math.ceil(remaining / recordsOtherPages);
            }

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            let fileName = `Stock-Movements-Report-${new Date().toISOString().split('T')[0]}`;
            if (filterDescription) {
                const shortFilter = filterDescription.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
                fileName += `-${shortFilter}`;
            }

            let recordIndex = 0;

            for (let pageNum = 0; pageNum < totalPages; pageNum++) {
                const recordsThisPage = (pageNum === 0) ? recordsFirstPage : recordsOtherPages;
                const startIndex = recordIndex;
                const endIndex = Math.min(recordIndex + recordsThisPage, filteredMovements.length);
                const pageMovements = filteredMovements.slice(startIndex, endIndex);

                recordIndex = endIndex;

                const container = document.createElement('div');
                container.style.position = 'fixed';
                container.style.top = '-10000px';
                container.style.left = '-10000px';
                container.style.width = '297mm';
                container.style.padding = '20px';
                container.style.backgroundColor = 'white';
                container.style.boxSizing = 'border-box';
                container.style.fontFamily = 'Arial, sans-serif';
                container.style.visibility = 'hidden';
                container.style.opacity = '0';
                container.style.pointerEvents = 'none';

                const logoHTML = logoBase64 ? `
                    <div style="display: flex; align-items: center; gap: 1px;">
                        <img src="${logoBase64}" alt="Company Logo" style="height: 100px; width: auto; object-fit: contain; margin-top: 20px" />
                        <div>
                            <h1 style="margin: 0 0 5px 0; font-size: 18px; font-weight: bold; text-transform: uppercase;">MUKAYH INVENTORY SYSTEM</h1>
                            <p style="margin: 0; font-size: 11px; color: #666;">Stock Movements Transaction Report</p>
                        </div>
                    </div>
                ` : `
                    <div> 
                        <h1 style="margin: 0 0 5px 0; font-size: 18px; font-weight: bold; text-transform: uppercase;">MUKAYH INVENTORY SYSTEM</h1>
                        <p style="margin: 0; font-size: 11px; color: #666;">Stock Movements Transaction Report</p>
                    </div>
                `;

                container.innerHTML = `
                <div style="width: 100%; visibility: visible; opacity: 1;">
                    <!-- Header Section -->
                    <div style="margin-bottom: 20px; padding-bottom: 15px; ">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                ${logoHTML}
                                <div style="font-weight: bold;color: #333;font-size: 12px;text-transform: uppercase;margin-top: 8px;padding: 6px 10px;background: #f5f5f5;border-left: 3px solid #000;display: inline-block;">
                                    STOCK MOVEMENTS REPORT
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold; text-transform: uppercase;">STOCK MOVEMENTS LOG</h2>
                                <p style="margin: 0 0 5px 0; font-size: 10px; color: #666;">Generated on: ${currentDate}</p>
                                <p style="margin: 0; font-size: 10px; color: #666;">Page ${pageNum + 1} of ${totalPages}</p>
                            </div>
                        </div>
                        ${filterDescription && pageNum === 0 ? `
                        <div style="margin-top: 10px; padding: 8px; background: #f0f0f0; border-radius: 4px; font-size: 11px;">
                            <strong>Applied Filters:</strong> ${filterDescription}
                        </div>
                        ` : ''}
                    </div>

                  
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-top: 10px; font-size: 9px;">
                        <thead>
                            <tr style="background: #2c3e50; color: white;">
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 4%;">#</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: left; width: 18%;">MATERIAL</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%;">TYPE</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%;">QUANTITY</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 10%;">UNIT PRICE</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 12%;">TOTAL VALUE</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 10%;">BEFORE/AFTER</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: left; width: 14%;">REFERENCE</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: left; width: 16%;">CREATED BY</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pageMovements.map((movement, idx) => {
                    const movementType = getMovementTypeInfo(movement.movement_type);
                    const materialName = movement.material_name || getMaterialName(movement.material);
                    const materialSku = movement.material_sku || 'N/A';
                    const unitPrice = formatCurrency(movement.unit_price || 0);
                    const totalValue = formatCurrency(movement.total_value || 0);
                    const quantity = parseFloat(movement.quantity) || 0;
                    const quantityDisplay = movement.movement_type === 'IN' ? `+${formatNumber(quantity)}` : `-${formatNumber(quantity)}`;
                    const stockBefore = parseFloat(movement.previous_stock) || 0;
                    const stockAfter = parseFloat(movement.new_stock) || 0;
                    const createdByName = movement.created_by_name || 'Unknown User';
                    const reference = movement.reference_number || 'No reference';

                    return `
                                <tr style="${idx % 2 === 0 ? 'background: #f9f9f9;' : 'background: white;'}">
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">${startIndex + idx + 1}</td>
                                    <td style="border: 1px solid #000; padding: 5px;">
                                        <div style="font-weight: bold; font-size: 9px;">${materialName}</div>
                                        <div style="font-size: 8px; color: #666;">SKU: ${materialSku}</div>
                                    </td>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">
                                        <div style="display: inline-block; padding: 2px 6px; border-radius: 10px; font-size: 8px; font-weight: bold; background: ${movementType.color}; color: ${movementType.textColor};">
                                            ${movementType.icon} ${movementType.label}
                                        </div>
                                    </td>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; color: ${movement.movement_type === 'IN' ? '#2e7d32' : '#c00'};">
                                        ${quantityDisplay}
                                    </td>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">
                                        ${unitPrice}
                                    </td>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">
                                        ${totalValue}
                                    </td>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">
                                        ${formatNumber(stockBefore)} → <strong>${formatNumber(stockAfter)}</strong>
                                    </td>
                                    <td style="border: 1px solid #000; padding: 5px; font-size: 8px;">
                                        ${reference}
                                    </td>
                                    <td style="border: 1px solid #000; padding: 5px; font-size: 8px;">
                                        ${createdByName}<br/>
                                        <span style="color: #666;">${formatDateForReport(movement.created_at)}</span>
                                    </td>
                                </tr>
                                `;
                }).join('')}
                        </tbody>
                        <tfoot style="background: #f0f0f0;">
                            <tr>
                                <td colspan="3" style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">PAGE TOTALS:</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">
                                    ${formatNumber(pageMovements.reduce((sum, m) => sum + (parseFloat(m.quantity) || 0), 0))}
                                </td>
                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">
                                    ${formatCurrency(pageMovements.reduce((sum, m) => sum + (parseFloat(m.total_value) || 0), 0))}
                                </td>
                                <td colspan="3" style="border: 1px solid #000; padding: 6px;"></td>
                            </tr>
                        </tfoot>
                    </table>

                    ${pageNum === 0 ? `
                    <div style="margin-top: 10px; padding: 8px; background: #f8f8f8; border-radius: 4px; font-size: 9px; color: #666;">
                        <strong>Notes:</strong> This report shows all stock movement transactions. Positive values indicate stock additions, negative values indicate stock deductions. Net Change: ${summary.netChange > 0 ? '+' : ''}${formatNumber(summary.netChange)} units.
                    </div>
                    ` : ''}

                    <!-- Footer Section -->
                    <div style="margin-top: ${pageNum === totalPages - 1 ? '30px' : '10px'}; padding-top: ${pageNum === totalPages - 1 ? '15px' : '5px'}; border-top: 1px solid #ddd;">
                        ${pageNum === totalPages - 1 ? `
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 20px;">
                            <div style="text-align: center;">
                                <div style="border-bottom: 1px solid #000; margin: 20px 0 8px 0; height: 1px;"></div>
                                <div style="font-weight: bold; font-size: 11px;">PREPARED BY</div>
                                <div style="font-size: 9px; color: #666; margin-top: 4px;">INVENTORY CONTROLLER</div>
                                <div style="font-size: 9px; margin-top: 5px; color: #666;">Date: ${new Date().toLocaleDateString('en-US')}</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="border-bottom: 1px solid #000; margin: 20px 0 8px 0; height: 1px;"></div>
                                <div style="font-weight: bold; font-size: 11px;">APPROVED BY</div>
                                <div style="font-size: 9px; color: #666; margin-top: 4px;">STORES MANAGER</div>
                                <div style="font-size: 9px; margin-top: 5px; color: #666;">Date: _________________</div>
                            </div>
                        </div>
                        ` : ''}
                        <div style="text-align: center; font-size: 8px; color: #666; margin-top: ${pageNum === totalPages - 1 ? '15px' : '5px'}; padding-top: 5px; border-top: ${pageNum === totalPages - 1 ? '1px solid #ddd' : 'none'};">
                            DOCUMENT ID: STK-${Date.now().toString().slice(-6)} | PAGE ${pageNum + 1} OF ${totalPages} | RECORDS ${startIndex + 1}-${endIndex} OF ${filteredMovements.length} | CONFIDENTIAL
                        </div>
                    </div>
                </div>
                `;

                document.body.appendChild(container);

                const canvas = await html2canvas(container, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    onclone: (clonedDoc, element) => {
                        element.style.visibility = 'visible';
                        element.style.opacity = '1';
                    }
                });

                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 297;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                if (pageNum > 0) {
                    pdf.addPage();
                }

                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

                document.body.removeChild(container);
            }

            pdf.save(`${fileName}.pdf`);

            toast.success(`Stock movements report downloaded successfully! (${filteredMovements.length} records in ${totalPages} page${totalPages > 1 ? 's' : ''})`);

        } catch (error) {
            console.error('Error generating PDF report:', error);
            toast.error('Failed to generate PDF report');
            throw error;
        }
    }

    static async generateDailySummaryReport(filteredMovements, materials, toast, date) {
        const dailySummary = {};

        filteredMovements.forEach(movement => {
            const materialId = movement.material;
            if (!dailySummary[materialId]) {
                dailySummary[materialId] = {
                    material: movement.material_name || getMaterialName(materialId, materials),
                    sku: movement.material_sku || 'N/A',
                    unit: movement.material?.unit || 'units',
                    stockIn: 0,
                    stockOut: 0,
                    totalValue: 0
                };
            }

            const quantity = parseFloat(movement.quantity) || 0;
            const value = parseFloat(movement.total_value) || 0;

            if (movement.movement_type === 'IN') {
                dailySummary[materialId].stockIn += quantity;
            } else {
                dailySummary[materialId].stockOut += quantity;
            }
            dailySummary[materialId].totalValue += value;
        });

        const summaryArray = Object.values(dailySummary);

        if (summaryArray.length === 0) {
            toast.warning('No movements found for the selected date.');
            return;
        }

        await this.generateStockMovementsReport(
            filteredMovements,
            { searchTerm: '', movementTypeFilter: 'All', materialFilter: 'All' },
            materials,
            toast
        );
    }
}

function getMaterialName(materialId, materials) {
    if (!materialId) return 'N/A';
    const material = materials?.find(mat => mat.id == materialId);
    return material ? material.name : 'Unknown Material';
}

export default StockMovementsPDFGenerator;