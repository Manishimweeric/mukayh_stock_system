import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class MaterialsAnalyticsPDFGenerator {
    static async generateMaterialsReport(filteredMaterials, filters, categories, suppliers, stockAnalytics, expiryAlerts, toast) {
        if (!filteredMaterials || filteredMaterials.length === 0) {
            toast.warning('No materials data to generate report.');
            return;
        }

        const { searchTerm, stockStatusFilter, categoryFilter, supplierFilter, priceRange, profitMarginRange } = filters;

        // Calculate summary statistics
        const calculateSummary = () => {
            let totalStockValue = 0;
            let totalCostValue = 0;
            let lowStockCount = 0;
            let overstockCount = 0;
            let totalProfit = 0;

            filteredMaterials.forEach(material => {
                const stock = parseFloat(material.current_stock) || 0;
                const sellingPrice = parseFloat(material.selling_price) || 0;
                const buyingPrice = parseFloat(material.buying_price) || 0;

                totalStockValue += stock * sellingPrice;
                totalCostValue += stock * buyingPrice;
                totalProfit += stock * (sellingPrice - buyingPrice);

                const reorder = parseFloat(material.reorder_level) || 0;
                const max = parseFloat(material.maximum_stock) || 0;

                if (stock <= reorder) lowStockCount++;
                if (stock >= max) overstockCount++;
            });

            return {
                total: filteredMaterials.length,
                lowStock: lowStockCount,
                overstock: overstockCount,
                totalStockValue: totalStockValue,
                totalCostValue: totalCostValue,
                totalProfit: totalProfit,
                avgMargin: totalStockValue > 0 ? (totalProfit / totalStockValue * 100) : 0
            };
        };

        const summary = calculateSummary();

        const getFilterDescription = () => {
            const filterList = [];
            if (searchTerm) filterList.push(`Search: "${searchTerm}"`);
            if (stockStatusFilter !== 'all') {
                const statusMap = { low: 'Low Stock', normal: 'Normal', overstock: 'Overstock' };
                filterList.push(`Stock Status: ${statusMap[stockStatusFilter] || stockStatusFilter}`);
            }
            if (categoryFilter !== 'all') {
                const category = categories?.find(cat => cat.id == categoryFilter);
                if (category) filterList.push(`Category: ${category.name}`);
            }
            if (supplierFilter !== 'all') {
                const supplier = suppliers?.find(sup => sup.id == supplierFilter);
                if (supplier) filterList.push(`Supplier: ${supplier.name}`);
            }
            if (priceRange.min) filterList.push(`Min Price: ${formatCurrency(priceRange.min)}`);
            if (priceRange.max) filterList.push(`Max Price: ${formatCurrency(priceRange.max)}`);
            if (profitMarginRange.min) filterList.push(`Min Margin: ${profitMarginRange.min}%`);
            if (profitMarginRange.max) filterList.push(`Max Margin: ${profitMarginRange.max}%`);

            return filterList.length === 0 ? null : filterList.join(', ');
        };

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('rw-RW', {
                style: 'currency',
                currency: 'RWF',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(Math.round(amount || 0));
        };

        const formatNumber = (num) => {
            return new Intl.NumberFormat().format(Math.round(num || 0));
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

        const getStockStatusText = (material) => {
            const currentStock = parseFloat(material.current_stock) || 0;
            const reorderLevel = parseFloat(material.reorder_level) || 0;
            const maximumStock = parseFloat(material.maximum_stock) || 0;

            if (currentStock <= reorderLevel) return 'LOW STOCK';
            if (currentStock >= maximumStock) return 'OVERSTOCK';
            return 'NORMAL';
        };

        const getStockStatusColor = (status) => {
            switch (status) {
                case 'LOW STOCK': return { bg: '#fee', text: '#c00' };
                case 'OVERSTOCK': return { bg: '#fff3e0', text: '#ff6f00' };
                default: return { bg: '#e8f5e9', text: '#2e7d32' };
            }
        };

        const calculateProfitMargin = (material) => {
            const selling = parseFloat(material.selling_price) || 0;
            const buying = parseFloat(material.buying_price) || 0;
            if (selling === 0) return 0;
            return ((selling - buying) / selling * 100).toFixed(1);
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

        try {
            const recordsPerPage = 20;
            const totalPages = Math.ceil(filteredMaterials.length / recordsPerPage);

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            let fileName = `Materials-Analytics-Report-${new Date().toISOString().split('T')[0]}`;
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

                container.innerHTML = `
                <div style="width: 100%; visibility: visible; opacity: 1;">
                    <!-- Header Section -->
                    <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #000;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div> 
                                <h1 style="margin: 0 0 5px 0; font-size: 18px; font-weight: bold; text-transform: uppercase;">MUKAYH INVENTORY SYSTEM</h1>
                                <p style="margin: 0; font-size: 11px; color: #666;">Materials Analytics & Inventory Report</p>
                                <div style="font-weight: bold;color: #333;font-size: 12px;text-transform: uppercase;margin-top: 8px;padding: 6px 10px;background: #f5f5f5;border-left: 3px solid #000;display: inline-block;">
                                    MATERIALS ANALYTICS REPORT
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold; text-transform: uppercase;">INVENTORY ANALYSIS</h2>
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

                    <!-- Summary Section (First Page Only) -->
                    ${pageNum === 0 ? `                    

                    <!-- Expiry Alerts Section -->
                    ${(expiryAlerts.expired_materials?.length > 0 || expiryAlerts.soon_to_expire_materials?.length > 0) ? `
                    <div style="margin-bottom: 15px; padding: 10px; background: #fff3e0; border-radius: 5px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #ff6f00;">EXPIRY ALERTS</h3>
                        ${expiryAlerts.expired_materials?.length > 0 ? `
                        <div style="margin-bottom: 8px;">
                            <span style="display: inline-block; padding: 3px 8px; background: #fee; color: #c00; border-radius: 4px; font-size: 10px; font-weight: bold;">EXPIRED</span>
                            <span style="font-size: 11px; margin-left: 8px;">${expiryAlerts.expired_materials.length} material(s) have expired</span>
                        </div>
                        ` : ''}
                        ${expiryAlerts.soon_to_expire_materials?.length > 0 ? `
                        <div>
                            <span style="display: inline-block; padding: 3px 8px; background: #fff3e0; color: #ff6f00; border-radius: 4px; font-size: 10px; font-weight: bold;">EXPIRING SOON</span>
                            <span style="font-size: 11px; margin-left: 8px;">${expiryAlerts.soon_to_expire_materials.length} material(s) will expire within 30 days</span>
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}
                    ` : ''}

                    <!-- Materials Table -->
                    <h3 style="margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: 1px solid #ddd; font-size: 15px; font-weight: bold;">
                        MATERIALS INVENTORY RECORDS
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-top: 10px; font-size: 9px;">
                        <thead>
                            <tr style="background: #2c3e50; color: white;">
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 4%;">#</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: left; width: 18%;">MATERIAL NAME</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: left; width: 10%;">SKU</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: left; width: 10%;">CATEGORY</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%;">CURRENT STOCK</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 6%;">UNIT</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 10%;">SELLING PRICE</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 10%;">STOCK VALUE</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%;">PROFIT MARGIN</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 10%;">STOCK STATUS</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 10%;">LAST UPDATED</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pageMaterials.map((material, index) => {
                    const stockStatus = getStockStatusText(material);
                    const statusColor = getStockStatusColor(stockStatus);
                    const stockValue = (parseFloat(material.current_stock) || 0) * (parseFloat(material.selling_price) || 0);
                    const profitMargin = calculateProfitMargin(material);
                    const categoryName = categories?.find(cat => cat.id == material.category)?.name || material.category?.name || 'N/A';
                    const marginColor = parseFloat(profitMargin) >= 20 ? '#2e7d32' : parseFloat(profitMargin) >= 10 ? '#ff6f00' : '#c00';

                    return `
                                <tr style="${index % 2 === 0 ? 'background: #f9f9f9;' : 'background: white;'}">
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">${startIndex + index + 1}</td>
                                    <td style="border: 1px solid #000; padding: 5px;">${material.name || 'Unnamed Material'}</td>
                                    <td style="border: 1px solid #000; padding: 5px;">${material.sku || 'N/A'}</td>
                                    <td style="border: 1px solid #000; padding: 5px;">${categoryName}</td>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">${formatNumber(material.current_stock || 0)}</td>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${material.unit || ''}</td>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${formatCurrency(material.selling_price || 0)}</td>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">${formatCurrency(stockValue)}</td>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; color: ${marginColor};">${profitMargin}%</td>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">
                                        <div style="display: inline-block; padding: 2px 6px; border-radius: 10px; font-size: 8px; font-weight: bold; background: ${statusColor.bg}; color: ${statusColor.text};">
                                            ${stockStatus}
                                        </div>
                                    </td>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center; font-size: 8px;">${formatDateForReport(material.updated_at)}</td>
                                </tr>
                                `;
                }).join('')}
                        </tbody>
                        <tfoot style="background: #f0f0f0;">
                            <tr>
                                <td colspan="4" style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">TOTALS:</td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">
                                    ${formatNumber(pageMaterials.reduce((sum, m) => sum + (parseFloat(m.current_stock) || 0), 0))}
                                </td>
                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">
                                    ${formatCurrency(pageMaterials.reduce((sum, m) => sum + ((parseFloat(m.current_stock) || 0) * (parseFloat(m.selling_price) || 0)), 0))}
                                </td>
                                <td colspan="3" style="border: 1px solid #000; padding: 6px;"></td>
                            </tr>
                        </tfoot>
                    </table>

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
                            DOCUMENT ID: MAT-${Date.now().toString().slice(-6)} | PAGE ${pageNum + 1} OF ${totalPages} | CONFIDENTIAL
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

            toast.success(`Materials analytics report downloaded successfully! (${totalPages} page${totalPages > 1 ? 's' : ''})`);

        } catch (error) {
            console.error('Error generating PDF report:', error);
            toast.error('Failed to generate PDF report');
            throw error;
        }
    }
}

export default MaterialsAnalyticsPDFGenerator;