import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class InventoryPDFGenerator {
    static async generateInventoryReport(filteredMaterials, filters, categories, suppliers, toast) {
        if (!filteredMaterials || filteredMaterials.length === 0) {
            toast.warning('No materials data to generate report.');
            return;
        }

        const { searchTerm, statusFilter, categoryFilter } = filters;

        // Calculate summary statistics
        const calculateSummary = () => {
            let totalValue = 0;
            let lowStockCount = 0;
            let overstockCount = 0;
            let activeCount = 0;
            let inactiveCount = 0;

            filteredMaterials.forEach(material => {
                const stock = parseFloat(material.current_stock) || 0;
                const price = parseFloat(material.unit_price) || 0;
                totalValue += stock * price;

                const reorder = parseFloat(material.reorder_level) || 0;
                const max = parseFloat(material.maximum_stock) || 0;

                if (stock <= reorder) lowStockCount++;
                if (stock >= max) overstockCount++;

                if (material.is_active) activeCount++;
                else inactiveCount++;
            });

            return {
                total: filteredMaterials.length,
                lowStock: lowStockCount,
                overstock: overstockCount,
                active: activeCount,
                inactive: inactiveCount,
                totalValue: totalValue
            };
        };

        const summary = calculateSummary();

        const getFilterDescription = () => {
            const filterList = [];
            if (searchTerm) filterList.push(`Search: "${searchTerm}"`);
            if (statusFilter !== 'All') filterList.push(`Status: ${statusFilter}`);
            if (categoryFilter !== 'All') {
                const category = categories?.find(cat => cat.id == categoryFilter);
                if (category) filterList.push(`Category: ${category.name}`);
            }
            return filterList.length === 0 ? null : `${filterList.join(', ')}`;
        };

        const formatDateForReport = (dateString) => {
            if (!dateString) return 'N/A';
            try {
                return new Date(dateString).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
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

        const getStockStatus = (material) => {
            const currentStock = parseFloat(material.current_stock) || 0;
            const reorderLevel = parseFloat(material.reorder_level) || 0;
            const maximumStock = parseFloat(material.maximum_stock) || 0;

            if (currentStock <= reorderLevel) {
                return { status: 'LOW STOCK', color: '#fee', textColor: '#c00' };
            } else if (currentStock >= maximumStock) {
                return { status: 'OVERSTOCK', color: '#fff3e0', textColor: '#ff6f00' };
            } else {
                return { status: 'NORMAL', color: '#e8f5e9', textColor: '#2e7d32' };
            }
        };

        const getStatusColor = (isActive) => {
            return isActive
                ? { color: '#e8f5e9', textColor: '#2e7d32', text: 'ACTIVE' }
                : { color: '#fee', textColor: '#c00', text: 'INACTIVE' };
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

            const recordsPerPage = 20;
            const totalPages = Math.ceil(filteredMaterials.length / recordsPerPage);

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            let fileName = `Materials-Inventory-Report-${new Date().toISOString().split('T')[0]}`;
            if (filterDescription) {
                const shortFilter = filterDescription.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
                fileName += `-${shortFilter}`;
            }

            for (let pageNum = 0; pageNum < totalPages; pageNum++) {
                const startIndex = pageNum * recordsPerPage;
                const endIndex = Math.min(startIndex + recordsPerPage, filteredMaterials.length);
                const pageMaterials = filteredMaterials.slice(startIndex, endIndex);

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
                            <p style="margin: 0; font-size: 11px; color: #666;">Materials Inventory Management Report</p>
                        </div>
                    </div>
                ` : `
                    <div> 
                        <h1 style="margin: 0 0 5px 0; font-size: 18px; font-weight: bold; text-transform: uppercase;">MUKAYH INVENTORY SYSTEM</h1>
                        <p style="margin: 0; font-size: 11px; color: #666;">Materials Inventory Management Report</p>
                    </div>
                `;

                container.innerHTML = `
                <div style="width: 100%; visibility: visible; opacity: 1;">
                    <!-- Header Section -->
                    <div style="margin-bottom: 20px; padding-bottom: 15px">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                ${logoHTML}
                                <div style="font-weight: bold;color: #333;font-size: 12px;text-transform: uppercase;margin-top: 8px;padding: 6px 10px;background: #f5f5f5;border-left: 3px solid #000;display: inline-block;">
                                    INVENTORY STATUS REPORT
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold; text-transform: uppercase;">MATERIALS INVENTORY</h2>
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
                                <th style="border: 1px solid #000; padding: 6px; text-align: left; width: 18%;">MATERIAL NAME</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: left; width: 12%;">CATEGORY</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%;">CURRENT STOCK</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 6%;">UNIT</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 10%;">UNIT PRICE</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 12%;">STOCK VALUE</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 10%;">STOCK STATUS</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 10%;">ACTIVE STATUS</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 10%;">LAST UPDATED</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pageMaterials.map((material, index) => {
                    const stockValue = (parseFloat(material.current_stock) || 0) * (parseFloat(material.unit_price) || 0);
                    const stockStatus = getStockStatus(material);
                    const activeStatus = getStatusColor(material.is_active);
                    const categoryName = categories?.find(cat => cat.id == material.category)?.name || material.category?.name || 'N/A';

                    return `
                                <tr style="${index % 2 === 0 ? 'background: #f9f9f9;' : 'background: white;'}">
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">${startIndex + index + 1}</td>
                                    <td style="border: 1px solid #000; padding: 5px; font-size: 9px;">${material.name || 'Unnamed Material'}</td>
                                    <td style="border: 1px solid #000; padding: 5px; font-size: 9px;">${categoryName}</td>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">${formatNumber(material.current_stock || 0)}</td>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${material.unit || ''}</td>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${formatCurrency(material.unit_price || 0)}</td>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">${formatCurrency(stockValue)}</td>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">
                                        <div style="display: inline-block; padding: 2px 6px; border-radius: 10px; font-size: 8px; font-weight: bold; background: ${stockStatus.color}; color: ${stockStatus.textColor};">
                                            ${stockStatus.status}
                                        </div>
                                    </td>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">
                                        <div style="display: inline-block; padding: 2px 6px; border-radius: 10px; font-size: 8px; font-weight: bold; background: ${activeStatus.color}; color: ${activeStatus.textColor};">
                                            ${activeStatus.text}
                                        </div>
                                    </td>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center; font-size: 8px;">${formatDateForReport(material.updated_at)}</td>
                                </tr>
                                `;
                }).join('')}
                        </tbody>
                        <tfoot style="background: #f0f0f0;">
                            <tr>
                                <td colspan="4" style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">PAGE TOTALS:</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">
                                    ${formatNumber(pageMaterials.reduce((sum, m) => sum + (parseFloat(m.current_stock) || 0), 0))}
                                </td>
                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">
                                    ${formatCurrency(pageMaterials.reduce((sum, m) => sum + ((parseFloat(m.current_stock) || 0) * (parseFloat(m.unit_price) || 0)), 0))}
                                </td>
                                <td colspan="3" style="border: 1px solid #000; padding: 6px;"></td>
                            </tr>
                        </tfoot>
                    </table>

                    ${pageNum === 0 ? `
                    <div style="margin-top: 10px; padding: 8px; background: #f8f8f8; border-radius: 4px; font-size: 9px; color: #666;">
                        <strong>Notes:</strong> Low Stock indicates materials at or below reorder level. Overstock indicates materials at or above maximum stock level. 
                        Inactive materials are not available for use.
                    </div>
                    ` : ''}

                    <!-- Footer Section -->
                    <div style="margin-top: ${pageNum === totalPages - 1 ? '30px' : '10px'}; padding-top: ${pageNum === totalPages - 1 ? '15px' : '5px'}; border-top: 1px solid #ddd;">
                        ${pageNum === totalPages - 1 ? `
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 20px;">
                            <div style="text-align: center;">
                                <div style="border-bottom: 1px solid #000; margin: 20px 0 8px 0; height: 1px;"></div>
                                <div style="font-weight: bold; font-size: 11px;">PREPARED BY</div>
                                <div style="font-size: 9px; color: #666; margin-top: 4px;">INVENTORY MANAGER</div>
                                <div style="font-size: 9px; margin-top: 5px; color: #666;">Date: ${new Date().toLocaleDateString('en-US')}</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="border-bottom: 1px solid #000; margin: 20px 0 8px 0; height: 1px;"></div>
                                <div style="font-weight: bold; font-size: 11px;">APPROVED BY</div>
                                <div style="font-size: 9px; color: #666; margin-top: 4px;">CONSTRUCTION DIRECTOR</div>
                                <div style="font-size: 9px; margin-top: 5px; color: #666;">Date: _________________</div>
                            </div>
                        </div>
                        ` : ''}
                        <div style="text-align: center; font-size: 8px; color: #666; margin-top: ${pageNum === totalPages - 1 ? '15px' : '5px'}; padding-top: 5px; border-top: ${pageNum === totalPages - 1 ? '1px solid #ddd' : 'none'};">
                            DOCUMENT ID: INV-${Date.now().toString().slice(-6)} | PAGE ${pageNum + 1} OF ${totalPages} | CONFIDENTIAL
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

            toast.success(`Inventory report downloaded successfully! (${totalPages} page${totalPages > 1 ? 's' : ''})`);

        } catch (error) {
            console.error('Error generating PDF report:', error);
            toast.error('Failed to generate PDF report');
            throw error;
        }
    }
}

export default InventoryPDFGenerator;